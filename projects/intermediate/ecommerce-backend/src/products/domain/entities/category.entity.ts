export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  }): Category {
    return new Category(
      props.id,
      props.name,
      props.slug,
      props.description ?? null,
      new Date(),
      new Date(),
    );
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
