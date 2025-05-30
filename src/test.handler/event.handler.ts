import { inject, injectable } from "inversify";
import { EventHandler } from "../decorators/event-handler";
import { TestEvent } from "./event";
import { IEventHandler } from "../event.bus";
import { TYPES } from "../type";
import { IEventPublisher } from "../broker";

@injectable()
@EventHandler(TestEvent)
export class TestEventHandler implements IEventHandler<TestEvent> {
  public constructor() {} //@inject(TYPES.EventPublisher) private readonly publisher: IEventPublisher

  async handle(event: TestEvent) {
    console.log("TestEventHandler executing...");
    console.log(`TestEventHandler values: ${JSON.stringify(event)}`);

    // await this.publisher.publish({
    //   topic: TestEvent.eventName,
    //   payload: event
    // });
    return { success: true };
  }
}
