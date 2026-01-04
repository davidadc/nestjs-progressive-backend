export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export class User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isManager(): boolean {
    return this.role === UserRole.MANAGER;
  }

  canManageProjects(): boolean {
    return this.role === UserRole.ADMIN;
  }

  canManageTasks(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.MANAGER;
  }
}
