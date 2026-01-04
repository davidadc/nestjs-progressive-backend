import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  type ITaskRepository,
  type CreateTaskData,
  type FindTasksOptions,
  type PaginatedTasks,
} from '../../domain/repositories/task.repository.interface';
import { Task } from '../../domain/entities/task.entity';
import { TaskStatus } from '../../domain/enums/task-status.enum';
import { TaskPriority } from '../../domain/enums/task-priority.enum';
import { User, UserRole } from '../../../users/domain/entities/user.entity';
import { Project } from '../../../projects/domain/entities/project.entity';
import {
  Task as PrismaTask,
  User as PrismaUser,
  Project as PrismaProject,
  TaskStatus as PrismaTaskStatus,
  TaskPriority as PrismaTaskPriority,
  Prisma,
} from '@prisma/client';

type PrismaTaskWithRelations = PrismaTask & {
  project?: PrismaProject;
  assignedTo?: PrismaUser | null;
  createdBy?: PrismaUser;
};

@Injectable()
export class TaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskData): Promise<Task> {
    const prismaTask = await this.prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        priority: (data.priority as PrismaTaskPriority) ?? PrismaTaskPriority.MEDIUM,
        dueDate: data.dueDate,
        assignedToId: data.assignedToId,
        createdById: data.createdById,
      },
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
      },
    });
    return this.mapToDomain(prismaTask);
  }

  async findById(id: string): Promise<Task | null> {
    const prismaTask = await this.prisma.task.findUnique({
      where: { id },
    });
    return prismaTask ? this.mapToDomain(prismaTask) : null;
  }

  async findByIdWithRelations(id: string): Promise<Task | null> {
    const prismaTask = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
      },
    });
    return prismaTask ? this.mapToDomain(prismaTask) : null;
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    const prismaTasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return prismaTasks.map((t) => this.mapToDomain(t));
  }

  async findByAssignedToId(assignedToId: string): Promise<Task[]> {
    const prismaTasks = await this.prisma.task.findMany({
      where: { assignedToId },
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return prismaTasks.map((t) => this.mapToDomain(t));
  }

  async findAll(options?: FindTasksOptions): Promise<PaginatedTasks> {
    const where: Prisma.TaskWhereInput = {};

    if (options?.filter) {
      const { filter } = options;
      if (filter.projectId) where.projectId = filter.projectId;
      if (filter.assignedToId) where.assignedToId = filter.assignedToId;
      if (filter.createdById) where.createdById = filter.createdById;
      if (filter.status) where.status = filter.status as PrismaTaskStatus;
      if (filter.priority) where.priority = filter.priority as PrismaTaskPriority;
      if (filter.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
    }

    const page = options?.pagination?.page ?? 1;
    const limit = options?.pagination?.limit ?? 10;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    if (options?.sort) {
      orderBy[options.sort.field] = options.sort.order;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [prismaTasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          project: true,
          assignedTo: true,
          createdBy: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: prismaTasks.map((t) => this.mapToDomain(t)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
    const updateData: Prisma.TaskUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status as PrismaTaskStatus;
    if (data.priority !== undefined) updateData.priority = data.priority as PrismaTaskPriority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.assignedToId !== undefined) {
      updateData.assignedTo = data.assignedToId
        ? { connect: { id: data.assignedToId } }
        : { disconnect: true };
    }

    const prismaTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
      },
    });
    return this.mapToDomain(prismaTask);
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const prismaTask = await this.prisma.task.update({
      where: { id },
      data: { status: status as PrismaTaskStatus },
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
      },
    });
    return this.mapToDomain(prismaTask);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({
      where: { id },
    });
  }

  async countByProjectId(projectId: string): Promise<number> {
    return this.prisma.task.count({
      where: { projectId },
    });
  }

  private mapToDomain(prismaTask: PrismaTaskWithRelations): Task {
    return new Task({
      id: prismaTask.id,
      projectId: prismaTask.projectId,
      project: prismaTask.project ? this.mapProjectToDomain(prismaTask.project) : undefined,
      title: prismaTask.title,
      description: prismaTask.description ?? undefined,
      status: prismaTask.status as TaskStatus,
      priority: prismaTask.priority as TaskPriority,
      dueDate: prismaTask.dueDate ?? undefined,
      assignedToId: prismaTask.assignedToId ?? undefined,
      assignedTo: prismaTask.assignedTo ? this.mapUserToDomain(prismaTask.assignedTo) : undefined,
      createdById: prismaTask.createdById,
      createdBy: prismaTask.createdBy ? this.mapUserToDomain(prismaTask.createdBy) : undefined,
      createdAt: prismaTask.createdAt,
      updatedAt: prismaTask.updatedAt,
    });
  }

  private mapProjectToDomain(prismaProject: PrismaProject): Project {
    return new Project({
      id: prismaProject.id,
      name: prismaProject.name,
      description: prismaProject.description ?? undefined,
      ownerId: prismaProject.ownerId,
      createdAt: prismaProject.createdAt,
      updatedAt: prismaProject.updatedAt,
    });
  }

  private mapUserToDomain(prismaUser: PrismaUser): User {
    return new User({
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      password: prismaUser.password,
      role: prismaUser.role as UserRole,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }
}
