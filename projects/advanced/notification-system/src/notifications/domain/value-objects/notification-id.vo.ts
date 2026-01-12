import { ValueObject } from '../../../common/domain/value-object';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { InvalidNotificationIdException } from '../exceptions/notification.exceptions';

interface NotificationIdProps {
  value: string;
}

export class NotificationId extends ValueObject<NotificationIdProps> {
  private constructor(props: NotificationIdProps) {
    super(props);
  }

  public static generate(): NotificationId {
    return new NotificationId({ value: uuidv4() });
  }

  public static create(id: string): NotificationId {
    if (!uuidValidate(id)) {
      throw new InvalidNotificationIdException(id);
    }
    return new NotificationId({ value: id });
  }

  get value(): string {
    return this.props.value;
  }
}
