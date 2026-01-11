import { Email } from './email.vo';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.value).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow('Email cannot be empty');
    });

    it('should throw error for whitespace-only email', () => {
      expect(() => Email.create('   ')).toThrow('Email cannot be empty');
    });

    it('should throw error for invalid email format - no @', () => {
      expect(() => Email.create('testexample.com')).toThrow(
        'Invalid email format',
      );
    });

    it('should throw error for invalid email format - no domain', () => {
      expect(() => Email.create('test@')).toThrow('Invalid email format');
    });

    it('should throw error for invalid email format - no local part', () => {
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for invalid email format - no TLD', () => {
      expect(() => Email.create('test@example')).toThrow('Invalid email format');
    });

    it('should accept email with subdomain', () => {
      const email = Email.create('test@mail.example.com');
      expect(email.value).toBe('test@mail.example.com');
    });

    it('should accept email with plus sign', () => {
      const email = Email.create('test+tag@example.com');
      expect(email.value).toBe('test+tag@example.com');
    });

    it('should accept email with dots in local part', () => {
      const email = Email.create('first.last@example.com');
      expect(email.value).toBe('first.last@example.com');
    });
  });

  describe('toString', () => {
    it('should return the email value', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });

  describe('equality', () => {
    it('should be equal to another Email with same value', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal to another Email with different value', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should be equal when one is uppercase and other lowercase', () => {
      const email1 = Email.create('TEST@EXAMPLE.COM');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });
  });
});
