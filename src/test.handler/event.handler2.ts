import { injectable } from "inversify";
import { EventHandler } from "../decorators/event-handler";
import { TestEvent } from "./event";
import { IEventHandler } from "../event.bus";

@injectable()
@EventHandler(TestEvent)
export class TestEventHandler2 implements IEventHandler<TestEvent> {
  public constructor() {}

  async handle(event: TestEvent) {
    console.log("TestEventHandler number 2 executing...");
    return { success: true };
  }
}
