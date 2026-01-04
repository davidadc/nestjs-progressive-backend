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
    private _addresses: Address[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get addresses(): Address[] {
    return [...this._addresses];
  }

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
    return this._addresses.find((addr) => addr.isDefault);
  }

  getAddressById(addressId: string): Address | undefined {
    return this._addresses.find((addr) => addr.id === addressId);
  }

  addAddress(address: Address): void {
    // If this is the first address or marked as default, ensure it's the only default
    if (address.isDefault || this._addresses.length === 0) {
      this._addresses = this._addresses.map((addr) => ({
        ...addr,
        isDefault: false,
      }));
      address = { ...address, isDefault: true };
    }
    this._addresses.push(address);
  }

  updateAddress(
    addressId: string,
    updates: Partial<Omit<Address, 'id'>>,
  ): Address | undefined {
    const index = this._addresses.findIndex((addr) => addr.id === addressId);
    if (index === -1) return undefined;

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      this._addresses = this._addresses.map((addr) => ({
        ...addr,
        isDefault: false,
      }));
    }

    this._addresses[index] = {
      ...this._addresses[index],
      ...updates,
    };

    return this._addresses[index];
  }

  removeAddress(addressId: string): boolean {
    const index = this._addresses.findIndex((addr) => addr.id === addressId);
    if (index === -1) return false;

    const wasDefault = this._addresses[index].isDefault;
    this._addresses.splice(index, 1);

    // If we removed the default and have other addresses, make the first one default
    if (wasDefault && this._addresses.length > 0) {
      this._addresses[0] = { ...this._addresses[0], isDefault: true };
    }

    return true;
  }

  setDefaultAddress(addressId: string): Address | undefined {
    const address = this.getAddressById(addressId);
    if (!address) return undefined;

    this._addresses = this._addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));

    return this.getAddressById(addressId);
  }
}
