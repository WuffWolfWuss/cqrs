import { IEvent } from "../event.bus";

export class TestEvent implements IEvent {
  public static readonly eventName = "something.something";
  public id: string;
  public message: string;

  public constructor(event: TestEvent) {
    Object.assign(this, event);
  }
}
