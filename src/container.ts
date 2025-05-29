import "reflect-metadata";

import { Container } from "inversify";
import { CommandBus } from "./command.bus";
import { CQRSModule, ICQRSModule } from "./cqrs.module";
import { TYPES } from "./type";
import { EventBus } from "./event.bus";

const container = new Container();

container.bind(TYPES.CommandBus).to(CommandBus).inSingletonScope();
container.bind(TYPES.EventBus).to(EventBus).inSingletonScope();
container.bind<ICQRSModule>(TYPES.CQRSModule).to(CQRSModule).inSingletonScope();
container.bind(TYPES.Container).toConstantValue(container);

export { container };
