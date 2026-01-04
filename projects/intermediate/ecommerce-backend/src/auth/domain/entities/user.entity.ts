export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly role: UserRole,
    public readonly addresses: Address[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    addresses?: Address[];
  }): User {
    return new User(
      props.id,
      props.email,
      props.password,
      props.name,
      props.role ?? UserRole.CUSTOMER,
      props.addresses ?? [],
      new Date(),
      new Date(),
    );
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  getDefaultAddress(): Address | undefined {
    return this.addresses.find((addr) => addr.isDefault);
  }

  getAddressById(addressId: string): Address | undefined {
    return this.addresses.find((addr) => addr.id === addressId);
  }
}
