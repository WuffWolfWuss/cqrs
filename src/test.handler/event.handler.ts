import { inject, injectable } from "inversify";
import { EventHandler } from "../decorators/event-handler";
import { TestEvent } from "./event";
import { IEventHandler } from "../event.bus";
import { TYPES } from "../type";
import { IBrokerPublisher } from "../broker";

@injectable()
@EventHandler(TestEvent)
export class TestEventHandler implements IEventHandler<TestEvent> {
  public constructor(@inject(TYPES.BrokerPublisher) private readonly broker: IBrokerPublisher) {}

  async handle(event: TestEvent) {
    console.log("TestEventHandler executing...");
    console.log(`TestEventHandler values: ${JSON.stringify(event)}`);

    // use event publisher to emit event cross services
    await this.broker.publish({
      topic: TestEvent.eventName,
      payload: event
    });
    return { success: true };
  }
}
