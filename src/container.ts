import "reflect-metadata";

import { Container } from "inversify";
import { CommandBus } from "./command.bus";
import { CQRSModule, ICQRSModule } from "./cqrs.module";
import { TYPES } from "./type";
import { EventBus } from "./event.bus";
import { KafkaBroker } from "./broker/kafka";
import { BrokerPublisher } from "./broker";
import { EventPublisher } from "./eventPub/event.publisher";
import { ObjectFactory } from "./eventPub/object.factory";
import { NatsBroker } from "./broker/nats";
import { EventHandlerService } from "./test.handler/event.consumer";

const container = new Container();
export const CQRSContainer = container

container.bind<ICQRSModule>(TYPES.CQRSModule).to(CQRSModule).inSingletonScope();
container.bind(TYPES.KafkaBroker).to(KafkaBroker).inSingletonScope();
container.bind(TYPES.NatsBroker).to(NatsBroker).inSingletonScope();
container.bind(TYPES.BrokerPublisher).to(BrokerPublisher).inSingletonScope();
container.bind(TYPES.CommandBus).to(CommandBus).inSingletonScope();
container.bind(TYPES.EventBus).to(EventBus).inSingletonScope();
container.bind(TYPES.EventPublisher).to(EventPublisher).inSingletonScope();
container.bind(TYPES.Container).toConstantValue(container);

//TEST
container.bind(TYPES.ObjectFactory).to(ObjectFactory);
container.bind(TYPES.EventHandlerService).to(EventHandlerService).inSingletonScope();

// container.bind(TYPES.EventHandlerService).toDynamicValue(() => {
//   return require("./test.handler/event.consumer").EventHandlerService;
// }).inSingletonScope();
