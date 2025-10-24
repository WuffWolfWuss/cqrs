import { CQRSContainer } from "./container";
import { ICQRSModule, ServiceType, SimpleCQRSType } from "./cqrs.module";
import { TestHandler } from "./test.handler/test.handler";
import { TestCommand } from "./test.handler/test.command";
import { TYPES } from "./type";
import { TestEvent } from "./test.handler/event";
import { TestEventHandler } from "./test.handler/event.handler";
import { TestEventHandler2 } from "./test.handler/event.handler2";
import { EventHandlerService } from "./test.handler/event.consumer";
import { MessageHandlerService } from "./test.handler/message.consumer";

function exploreServices(handler: ServiceType): SimpleCQRSType {
  if (!CQRSContainer.isBound(TYPES.CQRSModule)) {
    throw new Error("CQRSModule is not bound in the CQRSContainer");
  }
  const cqrs = CQRSContainer.get<ICQRSModule>(TYPES.CQRSModule);
  return cqrs.explore(handler);
}

async function main() {
  const { commandBus, eventBus } = exploreServices({ commands: [TestHandler], events: [TestEventHandler, TestEventHandler2] });
  const eventHandler = CQRSContainer.get<EventHandlerService>(TYPES.EventHandlerService);
  const messageHandler = new MessageHandlerService()
  // Trigger handler registration
  await eventHandler.registerHandlers();

  const command = new TestCommand({ id: "1000" });
  const cResult = await commandBus.execute<TestCommand>(command);
  console.log("command result: ", cResult);

  const event = new TestEvent({ id: "2000", message: "sth.sth" });
  eventBus.publish(event);
}

main().catch(console.error);
