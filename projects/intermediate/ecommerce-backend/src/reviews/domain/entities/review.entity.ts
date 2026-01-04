export class Review {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly productId: string,
    public readonly rating: number,
    public readonly comment: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    userId: string;
    userName: string;
    productId: string;
    rating: number;
    comment?: string;
  }): Review {
    if (props.rating < 1 || props.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return new Review(
      props.id,
      props.userId,
      props.userName,
      props.productId,
      props.rating,
      props.comment ?? null,
      new Date(),
      new Date(),
    );
  }

  update(props: { rating?: number; comment?: string }): Review {
    const rating = props.rating ?? this.rating;
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return new Review(
      this.id,
      this.userId,
      this.userName,
      this.productId,
      rating,
      props.comment ?? this.comment,
      this.createdAt,
      new Date(),
    );
  }
}
