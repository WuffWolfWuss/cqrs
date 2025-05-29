import { Container, inject, injectable } from "inversify";
import { ObservableBus } from "./rxjs-util/observable-bus";
import { Type } from "./interface";
import { TYPES } from "./type";
import { EVENTS_HANDLER_METADATA } from "./decorators/constants";
import { filter, Subscription } from "rxjs";

export interface IEvent {}
export interface IEventHandler<T extends IEvent = any> {
  handle(event: T): any;
}
export type EventHandlerType<EventBase extends IEvent = IEvent> = Type<IEventHandler<EventBase>>;
export interface IEventPublisher<EventBase extends IEvent = IEvent> {
  publish<T extends EventBase = EventBase>(event: T): any;
  publishAll?<T extends EventBase = EventBase>(events: T[]): any;
}

class Publisher<EventBase extends IEvent> implements IEventPublisher<EventBase> {
  constructor(private readonly next: (value: EventBase) => void) {}

  publish<T extends EventBase>(event: T) {
    this.next(event);
  }
}

@injectable()
export class EventBus<EventBase extends IEvent = IEvent> extends ObservableBus<EventBase> {
  protected readonly subscriptions: Subscription[] = [];
  private readonly _publisher: IEventPublisher<EventBase>;
  private readonly handlers = new Map<Function, EventHandlerType<EventBase>>();

  constructor(@inject(TYPES.Container) private readonly container: Container) {
    super();
    this._publisher = new Publisher(this.next.bind(this));
  }

  publish<T extends EventBase>(event: T) {
    return this._publisher.publish(event);
  }

  register(handlers: EventHandlerType<EventBase>[] = []) {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  protected registerHandler(handlerType: EventHandlerType) {
    // Bind the handler to the container if not already bound
    if (!this.container.isBound(handlerType)) {
      this.container.bind(handlerType).toSelf();
    }

    // Get the event class associated with the handler
    const eventClass = Reflect.getMetadata(EVENTS_HANDLER_METADATA, handlerType);
    if (!eventClass) {
      throw new Error(`No event found for handler ${handlerType.name}`);
    }

    this.handlers.set(eventClass, handlerType);

    // Subscribe to events of the specific type
    const subscription = this.observable.pipe(filter((event) => Object.getPrototypeOf(event).constructor === eventClass)).subscribe((event) => {
      const handler = this.container.get(handlerType) as IEventHandler;
      handler.handle(event);
    });

    this.subscriptions.push(subscription);
  }
}
