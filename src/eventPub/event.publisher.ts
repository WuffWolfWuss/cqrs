import { inject, injectable } from "inversify";
import { EventBus, IEvent } from "../event.bus";
import { TYPES } from "../type";

export abstract class AggregateRoot<EventBase extends IEvent = IEvent> {
  publish<T extends EventBase = EventBase>(event: T) {
    // Empty method of abstract class
  }
}

@injectable()
export class EventPublisher<EventBase extends IEvent = IEvent> {
  constructor(@inject(TYPES.EventBus) private readonly eventBus: EventBus<EventBase>) {}

  mergeObjectContext<T extends AggregateRoot<EventBase>>(object: T): T {
    object.publish = (event: EventBase) => {
      this.eventBus.publish(event);
    };
    return object;
  }
}
