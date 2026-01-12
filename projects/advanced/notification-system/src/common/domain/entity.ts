/**
 * Base class for Entities.
 * Entities have identity and are compared by their ID.
 */
export abstract class Entity<T> {
  protected readonly _id: T;

  protected constructor(id: T) {
    this._id = id;
  }

  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    if (!(entity instanceof Entity)) {
      return false;
    }
    return JSON.stringify(this._id) === JSON.stringify(entity._id);
  }
}
