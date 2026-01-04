import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  type IProjectRepository,
  type CreateProjectData,
} from '../../domain/repositories/project.repository.interface';
import { Project } from '../../domain/entities/project.entity';
import { User, UserRole } from '../../../users/domain/entities/user.entity';
import {
  Project as PrismaProject,
  User as PrismaUser,
} from '@prisma/client';

type PrismaProjectWithRelations = PrismaProject & {
  owner?: PrismaUser;
  members?: PrismaUser[];
};

@Injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectData): Promise<Project> {
    const prismaProject = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        members: {
          connect: { id: data.ownerId },
        },
      },
      include: {
        owner: true,
        members: true,
      },
    });
    return this.mapToDomain(prismaProject);
  }

  async findById(id: string): Promise<Project | null> {
    const prismaProject = await this.prisma.project.findUnique({
      where: { id },
    });
    return prismaProject ? this.mapToDomain(prismaProject) : null;
  }

  async findByIdWithMembers(id: string): Promise<Project | null> {
    const prismaProject = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: true,
        members: true,
      },
    });
    return prismaProject ? this.mapToDomain(prismaProject) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Project[]> {
    const prismaProjects = await this.prisma.project.findMany({
      where: { ownerId },
      include: {
        owner: true,
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return prismaProjects.map((p) => this.mapToDomain(p));
  }

  async findByMemberId(memberId: string): Promise<Project[]> {
    const prismaProjects = await this.prisma.project.findMany({
      where: {
        members: {
          some: { id: memberId },
        },
      },
      include: {
        owner: true,
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return prismaProjects.map((p) => this.mapToDomain(p));
  }

  async findAllAccessibleByUser(userId: string): Promise<Project[]> {
    const prismaProjects = await this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { id: userId } } },
        ],
      },
      include: {
        owner: true,
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return prismaProjects.map((p) => this.mapToDomain(p));
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const prismaProject = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: true,
        members: true,
      },
    });
    return this.mapToDomain(prismaProject);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }

  async addMember(projectId: string, userId: string): Promise<Project> {
    const prismaProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        owner: true,
        members: true,
      },
    });
    return this.mapToDomain(prismaProject);
  }

  async removeMember(projectId: string, userId: string): Promise<Project> {
    const prismaProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
      include: {
        owner: true,
        members: true,
      },
    });
    return this.mapToDomain(prismaProject);
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) return false;
    if (project.ownerId === userId) return true;
    return project.members.some((m) => m.id === userId);
  }

  private mapToDomain(prismaProject: PrismaProjectWithRelations): Project {
    return new Project({
      id: prismaProject.id,
      name: prismaProject.name,
      description: prismaProject.description ?? undefined,
      ownerId: prismaProject.ownerId,
      owner: prismaProject.owner ? this.mapUserToDomain(prismaProject.owner) : undefined,
      members: prismaProject.members?.map((m) => this.mapUserToDomain(m)),
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
