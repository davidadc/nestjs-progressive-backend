export class UserEntity {
  id: string;
  email: string;
  name: string;
  password: string;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  static create(props: {
    email: string;
    name: string;
    password: string;
    avatar?: string;
  }): UserEntity {
    return new UserEntity({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
