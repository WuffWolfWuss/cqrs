import { IEvent } from "../../event.bus";

export class TestEvent implements IEvent {
  public static readonly eventName = "EV3";
  public id: string;
  public message: string;

  public constructor(event: TestEvent) {
    Object.assign(this, event);
  }
}
