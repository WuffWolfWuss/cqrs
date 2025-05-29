import { injectable } from "inversify";
import { EventsHandler } from "../decorators/event-handler";
import { TestEvent } from "./event";
import { IEventHandler } from "../event.bus";

@injectable()
@EventsHandler(TestEvent)
export class TestEventHandler implements IEventHandler<TestEvent> {
  public constructor() {}

  handle(event: TestEvent) {
    console.log("TestEventHandler executing...");
    console.log(`TestEventHandler values: ${JSON.stringify(event)}`);
    return { success: true };
  }
}
