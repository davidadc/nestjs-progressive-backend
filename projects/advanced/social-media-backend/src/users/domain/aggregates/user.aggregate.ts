import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UserId, Email, Username } from '../value-objects';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserFollowedEvent } from '../events/user-followed.event';
import { UserUnfollowedEvent } from '../events/user-unfollowed.event';

export interface CreateUserProps {
  email: string;
  username: string;
  name: string;
  password: string;
}

export interface ReconstructUserProps {
  id: string;
  email: string;
  username: string;
  name: string;
  password: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileProps {
  name?: string;
  bio?: string;
  avatar?: string;
}

export class User extends AggregateRoot<UserId> {
  private _email: Email;
  private _username: Username;
  private _name: string;
  private _password: string;
  private _avatar?: string;
  private _bio?: string;
  private _followersCount: number;
  private _followingCount: number;
  private _postsCount: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: UserId) {
    super(id);
  }

  // Factory method for creating a new user
  public static create(props: CreateUserProps): User {
    const userId = UserId.generate();
    const email = Email.create(props.email);
    const username = Username.create(props.username);

    const user = new User(userId);
    user._email = email;
    user._username = username;
    user._name = props.name;
    user._password = props.password;
    user._followersCount = 0;
    user._followingCount = 0;
    user._postsCount = 0;
    user._createdAt = new Date();
    user._updatedAt = new Date();

    // Add domain event
    user.addDomainEvent(
      new UserRegisteredEvent(userId.value, email.value, username.value),
    );

    return user;
  }

  // Factory method for reconstructing from persistence
  public static reconstitute(props: ReconstructUserProps): User {
    const userId = UserId.create(props.id);
    const email = Email.create(props.email);
    const username = Username.create(props.username);

    const user = new User(userId);
    user._email = email;
    user._username = username;
    user._name = props.name;
    user._password = props.password;
    user._avatar = props.avatar;
    user._bio = props.bio;
    user._followersCount = props.followersCount;
    user._followingCount = props.followingCount;
    user._postsCount = props.postsCount;
    user._createdAt = props.createdAt;
    user._updatedAt = props.updatedAt;

    return user;
  }

  // Business method: Update profile
  public updateProfile(props: UpdateProfileProps): void {
    if (props.name !== undefined) {
      this._name = props.name;
    }
    if (props.bio !== undefined) {
      this._bio = props.bio;
    }
    if (props.avatar !== undefined) {
      this._avatar = props.avatar;
    }
    this._updatedAt = new Date();
  }

  // Business method: Follow another user
  public follow(targetUserId: string): void {
    this._followingCount++;
    this._updatedAt = new Date();

    this.addDomainEvent(new UserFollowedEvent(this._id.value, targetUserId));
  }

  // Business method: Unfollow another user
  public unfollow(targetUserId: string): void {
    if (this._followingCount > 0) {
      this._followingCount--;
      this._updatedAt = new Date();

      this.addDomainEvent(
        new UserUnfollowedEvent(this._id.value, targetUserId),
      );
    }
  }

  // Business method: Gain a follower
  public addFollower(): void {
    this._followersCount++;
    this._updatedAt = new Date();
  }

  // Business method: Lose a follower
  public removeFollower(): void {
    if (this._followersCount > 0) {
      this._followersCount--;
      this._updatedAt = new Date();
    }
  }

  // Business method: Create a post
  public addPost(): void {
    this._postsCount++;
    this._updatedAt = new Date();
  }

  // Business method: Delete a post
  public removePost(): void {
    if (this._postsCount > 0) {
      this._postsCount--;
      this._updatedAt = new Date();
    }
  }

  // Check if this user can follow another user
  public canFollow(targetUserId: string): boolean {
    return this._id.value !== targetUserId;
  }

  // Getters
  get email(): string {
    return this._email.value;
  }

  get username(): string {
    return this._username.value;
  }

  get name(): string {
    return this._name;
  }

  get password(): string {
    return this._password;
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  get bio(): string | undefined {
    return this._bio;
  }

  get followersCount(): number {
    return this._followersCount;
  }

  get followingCount(): number {
    return this._followingCount;
  }

  get postsCount(): number {
    return this._postsCount;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Required by AggregateRoot
  toPrimitives(): Record<string, unknown> {
    return {
      id: this._id.value,
      email: this._email.value,
      username: this._username.value,
      name: this._name,
      avatar: this._avatar,
      bio: this._bio,
      followersCount: this._followersCount,
      followingCount: this._followingCount,
      postsCount: this._postsCount,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
