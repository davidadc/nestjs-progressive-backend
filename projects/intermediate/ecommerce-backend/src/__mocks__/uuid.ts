// Real UUID implementation for tests
import { randomUUID } from 'crypto';

export const v4 = (): string => randomUUID();
export const v1 = (): string => randomUUID();
export const v5 = (): string => randomUUID();
export const v3 = (): string => randomUUID();

export default {
  v4,
  v1,
  v5,
  v3,
};
