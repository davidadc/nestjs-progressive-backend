import { Project } from '../entities/project.entity';

export interface CreateProjectData {
  name: string;
  description?: string;
  ownerId: string;
}

export interface IProjectRepository {
  create(data: CreateProjectData): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByIdWithMembers(id: string): Promise<Project | null>;
  findByOwnerId(ownerId: string): Promise<Project[]>;
  findByMemberId(memberId: string): Promise<Project[]>;
  findAllAccessibleByUser(userId: string): Promise<Project[]>;
  update(id: string, data: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;
  addMember(projectId: string, userId: string): Promise<Project>;
  removeMember(projectId: string, userId: string): Promise<Project>;
  isMember(projectId: string, userId: string): Promise<boolean>;
}

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');
