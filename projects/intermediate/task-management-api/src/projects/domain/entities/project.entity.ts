import { User } from '../../../users/domain/entities/user.entity';

export class Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner?: User;
  members?: User[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Project>) {
    Object.assign(this, partial);
  }

  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  isMember(userId: string): boolean {
    if (this.isOwner(userId)) return true;
    return this.members?.some((member) => member.id === userId) ?? false;
  }

  canUserAccess(userId: string): boolean {
    return this.isMember(userId);
  }
}
