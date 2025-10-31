import { CQRSContainer } from "./container";
import { ICQRSModule, ServiceType, SimpleCQRSType } from "./cqrs.module";
import { TestHandler } from "./test.handler/command/test.handler";
import { TestCommand } from "./test.handler/command/test.command";
import { TYPES } from "./type";
import { TestEvent } from "./test.handler/events/event";
import { TestEventHandler } from "./test.handler/events/event.handler";
import { TestEventHandler2 } from "./test.handler/events/event.handler2";
import { MessageHandlerService } from "./test.handler/consumer/message.consumer";
import { EventHandlerService } from "./test.handler/consumer/event.consumer";
import { MessageCommand } from "./test.handler/command/message.command";
import { MessageHandler } from "./test.handler/command/message.handler";
import { BrokerPublisher } from "./broker";

function exploreServices(handler: ServiceType): SimpleCQRSType {
  if (!CQRSContainer.isBound(TYPES.CQRSModule)) {
    throw new Error("CQRSModule is not bound in the CQRSContainer");
  }
  const cqrs = CQRSContainer.get<ICQRSModule>(TYPES.CQRSModule);
  return cqrs.explore(handler);
}

async function main() {
  const { commandBus, eventBus } = exploreServices({ 
    commands: [TestHandler, MessageHandler], 
    events: [TestEventHandler, TestEventHandler2],
    queries: []
  });
  const broker = CQRSContainer.get<BrokerPublisher>(TYPES.BrokerPublisher);
  await broker.subscribe(new EventHandlerService());

  const messageBroker = CQRSContainer.get<MessageHandlerService>(TYPES.MessageHandlerService);
  await messageBroker.subscribe();

  // const command = new TestCommand({ id: "1000" });
  // const cResult = await commandBus.execute<TestCommand>(command);
  // console.log("command result: ", cResult);

  // const command2 = new MessageCommand({ msg: "Testing. Testing" });
  // const c2Result = await commandBus.execute<MessageCommand>(command2);
  // console.log("command result: ", c2Result);

  const event = new TestEvent({ id: "2000", message: "sth.sth" });
  eventBus.publish(event);
}

process.on('SIGINT', async () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  const broker = CQRSContainer.get<{ shutdown: () => Promise<void> }>(TYPES.BrokerPublisher);
  await broker.shutdown();
  process.exit(0);
});

main().catch((error) => {
  console.error('Error in main:', error);
  process.exit(1);
});
