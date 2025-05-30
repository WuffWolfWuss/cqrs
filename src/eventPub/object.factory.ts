import { inject, injectable } from "inversify";
import { AggregateRoot, EventPublisher } from "./event.publisher";
import { TYPES } from "../type";
import { IEvent } from "../event.bus";

export class ImplementObejct extends AggregateRoot {
  public id: string;
  public constructor(props: { id: string }) {
    super();
    Object.assign(this, props);
  }

  public publishEvent(event: IEvent): void {
    this.publish(event);
  }
}

@injectable()
export class ObjectFactory {
  public constructor(
    @inject(TYPES.EventPublisher)
    private readonly eventPublisher: EventPublisher
  ) {}

  public create(order: { id: string }) {
    return this.eventPublisher.mergeObjectContext(new ImplementObejct(order));
  }
}
