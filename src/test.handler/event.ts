import { IEvent } from "../event.bus";

export class TestEvent implements IEvent {
  public static eventName = "bankTransfer.tranferSuccess";
  public id: string;

  public constructor(event: TestEvent) {
    Object.assign(this, event);
  }
}
