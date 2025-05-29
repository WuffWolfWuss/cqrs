import { container } from "./container";
import { ICQRSModule, ServiceType, SimpleCQRSType } from "./cqrs.module";
import { TestHandler } from "./test.handler/test.handler";
import { TestCommand } from "./test.handler/test.command";
import { TYPES } from "./type";
import { TestEvent } from "./test.handler/event";
import { TestEventHandler } from "./test.handler/event.handler";

function exploreServices(handler: ServiceType): SimpleCQRSType {
  if (!container.isBound(TYPES.CQRSModule)) {
    throw new Error("CQRSModule is not bound in the container");
  }
  const cqrs = container.get<ICQRSModule>(TYPES.CQRSModule);
  return cqrs.explore(handler);
}

async function main() {
  const { commandBus, eventBus } = exploreServices({ commands: [TestHandler], events: [TestEventHandler] });
  const command = new TestCommand({ id: "1000" });
  commandBus.execute<TestCommand>(command);

  const event = new TestEvent({ id: "2000" });
  eventBus.publish(event);
}

main().catch(console.error);
