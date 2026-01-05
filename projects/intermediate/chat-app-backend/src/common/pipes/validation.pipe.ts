import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

type Metatype = new (...args: unknown[]) => object;

@Injectable()
export class CustomValidationPipe implements PipeTransform<unknown, unknown> {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const object: object = plainToInstance(
      metatype,
      value as Record<string, unknown>,
    );
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map((error) => {
        const constraints = error.constraints;
        return constraints ? Object.values(constraints).join(', ') : '';
      });

      throw new BadRequestException({
        message: messages,
        error: 'Validation failed',
      });
    }

    return object;
  }

  private toValidate(metatype: Metatype): boolean {
    const types: Metatype[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
