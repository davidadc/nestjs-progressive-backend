import { ValueObject } from '../../../common/domain';
import {
  InvalidMoneyException,
  CurrencyMismatchException,
} from '../exceptions/payment.exceptions';

const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'NGN',
  'CAD',
  'AUD',
] as const;
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

interface MoneyProps {
  amount: number;
  currency: SupportedCurrency;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  public static create(amount: number, currency: string = 'USD'): Money {
    if (amount < 0) {
      throw new InvalidMoneyException('Amount cannot be negative');
    }

    if (amount > 999999999.99) {
      throw new InvalidMoneyException('Amount exceeds maximum allowed value');
    }

    const upperCurrency = currency.toUpperCase() as SupportedCurrency;
    if (!SUPPORTED_CURRENCIES.includes(upperCurrency)) {
      throw new InvalidMoneyException(`Unsupported currency: ${currency}`);
    }

    // Round to 2 decimal places
    const roundedAmount = Math.round(amount * 100) / 100;

    return new Money({ amount: roundedAmount, currency: upperCurrency });
  }

  public static zero(currency: string = 'USD'): Money {
    return Money.create(0, currency);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  /**
   * Returns amount in cents (for payment providers)
   */
  get amountInCents(): number {
    return Math.round(this.props.amount * 100);
  }

  public add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException(this.currency, other.currency);
    }
    return Money.create(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException(this.currency, other.currency);
    }
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new InvalidMoneyException(
        'Subtraction would result in negative amount',
      );
    }
    return Money.create(result, this.currency);
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new InvalidMoneyException('Cannot multiply by negative factor');
    }
    return Money.create(this.amount * factor, this.currency);
  }

  public isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException(this.currency, other.currency);
    }
    return this.amount > other.amount;
  }

  public isLessThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException(this.currency, other.currency);
    }
    return this.amount < other.amount;
  }

  public isZero(): boolean {
    return this.amount === 0;
  }

  public toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}
