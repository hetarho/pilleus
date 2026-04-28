import { Entity } from "./entity";

export abstract class AggregateRoot<TId extends string | number> extends Entity<TId> {
  private _domainEvents: unknown[] = [];

  protected addDomainEvent(event: unknown): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): unknown[] {
    const events = this._domainEvents;
    this._domainEvents = [];
    return events;
  }
}
