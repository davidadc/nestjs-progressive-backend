import { Money } from '../money.vo';
import {
  InvalidMoneyException,
  CurrencyMismatchException,
} from '../../exceptions/payment.exceptions';

describe('Money Value Object', () => {
  describe('create', () => {
    it('should create a Money instance with valid amount and currency', () => {
      const money = Money.create(100.5, 'USD');

      expect(money.amount).toBe(100.5);
      expect(money.currency).toBe('USD');
    });

    it('should default to USD currency', () => {
      const money = Money.create(50);

      expect(money.currency).toBe('USD');
    });

    it('should uppercase currency', () => {
      const money = Money.create(50, 'usd');

      expect(money.currency).toBe('USD');
    });

    it('should round amount to 2 decimal places', () => {
      const money = Money.create(99.999, 'USD');

      expect(money.amount).toBe(100);
    });

    it('should throw InvalidMoneyException for negative amount', () => {
      expect(() => Money.create(-10, 'USD')).toThrow(InvalidMoneyException);
      expect(() => Money.create(-10, 'USD')).toThrow(
        'Amount cannot be negative',
      );
    });

    it('should throw InvalidMoneyException for amount exceeding maximum', () => {
      expect(() => Money.create(1000000000, 'USD')).toThrow(
        InvalidMoneyException,
      );
      expect(() => Money.create(1000000000, 'USD')).toThrow(
        'Amount exceeds maximum allowed value',
      );
    });

    it('should throw InvalidMoneyException for unsupported currency', () => {
      expect(() => Money.create(100, 'XYZ')).toThrow(InvalidMoneyException);
      expect(() => Money.create(100, 'XYZ')).toThrow(
        'Unsupported currency: XYZ',
      );
    });

    it('should support all defined currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];

      currencies.forEach((currency) => {
        const money = Money.create(100, currency);
        expect(money.currency).toBe(currency);
      });
    });
  });

  describe('zero', () => {
    it('should create a zero Money instance', () => {
      const money = Money.zero('USD');

      expect(money.amount).toBe(0);
      expect(money.currency).toBe('USD');
    });

    it('should default to USD', () => {
      const money = Money.zero();

      expect(money.currency).toBe('USD');
    });
  });

  describe('amountInCents', () => {
    it('should return amount in cents', () => {
      const money = Money.create(99.99, 'USD');

      expect(money.amountInCents).toBe(9999);
    });

    it('should handle whole amounts', () => {
      const money = Money.create(100, 'USD');

      expect(money.amountInCents).toBe(10000);
    });

    it('should handle zero', () => {
      const money = Money.zero();

      expect(money.amountInCents).toBe(0);
    });
  });

  describe('add', () => {
    it('should add two Money instances with same currency', () => {
      const money1 = Money.create(50, 'USD');
      const money2 = Money.create(30, 'USD');

      const result = money1.add(money2);

      expect(result.amount).toBe(80);
      expect(result.currency).toBe('USD');
    });

    it('should throw CurrencyMismatchException for different currencies', () => {
      const money1 = Money.create(50, 'USD');
      const money2 = Money.create(30, 'EUR');

      expect(() => money1.add(money2)).toThrow(CurrencyMismatchException);
    });
  });

  describe('subtract', () => {
    it('should subtract two Money instances with same currency', () => {
      const money1 = Money.create(50, 'USD');
      const money2 = Money.create(30, 'USD');

      const result = money1.subtract(money2);

      expect(result.amount).toBe(20);
      expect(result.currency).toBe('USD');
    });

    it('should throw InvalidMoneyException for negative result', () => {
      const money1 = Money.create(30, 'USD');
      const money2 = Money.create(50, 'USD');

      expect(() => money1.subtract(money2)).toThrow(InvalidMoneyException);
      expect(() => money1.subtract(money2)).toThrow(
        'Subtraction would result in negative amount',
      );
    });

    it('should throw CurrencyMismatchException for different currencies', () => {
      const money1 = Money.create(50, 'USD');
      const money2 = Money.create(30, 'EUR');

      expect(() => money1.subtract(money2)).toThrow(CurrencyMismatchException);
    });
  });

  describe('multiply', () => {
    it('should multiply Money by a positive factor', () => {
      const money = Money.create(25, 'USD');

      const result = money.multiply(3);

      expect(result.amount).toBe(75);
    });

    it('should handle zero factor', () => {
      const money = Money.create(100, 'USD');

      const result = money.multiply(0);

      expect(result.amount).toBe(0);
    });

    it('should throw InvalidMoneyException for negative factor', () => {
      const money = Money.create(100, 'USD');

      expect(() => money.multiply(-2)).toThrow(InvalidMoneyException);
      expect(() => money.multiply(-2)).toThrow(
        'Cannot multiply by negative factor',
      );
    });
  });

  describe('comparison methods', () => {
    it('should correctly determine if greater than', () => {
      const money1 = Money.create(100, 'USD');
      const money2 = Money.create(50, 'USD');

      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(false);
    });

    it('should correctly determine if less than', () => {
      const money1 = Money.create(50, 'USD');
      const money2 = Money.create(100, 'USD');

      expect(money1.isLessThan(money2)).toBe(true);
      expect(money2.isLessThan(money1)).toBe(false);
    });

    it('should throw CurrencyMismatchException for comparison with different currencies', () => {
      const money1 = Money.create(100, 'USD');
      const money2 = Money.create(50, 'EUR');

      expect(() => money1.isGreaterThan(money2)).toThrow(
        CurrencyMismatchException,
      );
      expect(() => money1.isLessThan(money2)).toThrow(
        CurrencyMismatchException,
      );
    });
  });

  describe('isZero', () => {
    it('should return true for zero amount', () => {
      const money = Money.zero();

      expect(money.isZero()).toBe(true);
    });

    it('should return false for non-zero amount', () => {
      const money = Money.create(0.01, 'USD');

      expect(money.isZero()).toBe(false);
    });
  });

  describe('toString', () => {
    it('should format as currency and amount', () => {
      const money = Money.create(99.99, 'USD');

      expect(money.toString()).toBe('USD 99.99');
    });

    it('should format whole amounts with two decimal places', () => {
      const money = Money.create(100, 'EUR');

      expect(money.toString()).toBe('EUR 100.00');
    });
  });

  describe('equality', () => {
    it('should be equal for same amount and currency', () => {
      const money1 = Money.create(100, 'USD');
      const money2 = Money.create(100, 'USD');

      expect(money1.equals(money2)).toBe(true);
    });

    it('should not be equal for different amounts', () => {
      const money1 = Money.create(100, 'USD');
      const money2 = Money.create(50, 'USD');

      expect(money1.equals(money2)).toBe(false);
    });

    it('should not be equal for different currencies', () => {
      const money1 = Money.create(100, 'USD');
      const money2 = Money.create(100, 'EUR');

      expect(money1.equals(money2)).toBe(false);
    });
  });
});
