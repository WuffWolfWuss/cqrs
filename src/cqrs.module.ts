import { CommandBus, CommandHandlerType, ICommand } from "./command.bus";
import { injectable, inject } from "inversify";
import { TYPES } from "./type";
import { EventBus, EventHandlerType, IEvent } from "./event.bus";

export type ServiceType = Required<{
  commands: CommandHandlerType[];
  events: EventHandlerType[];
}>;

export interface ICommandBus<CommandBase extends ICommand = ICommand> {
  execute<T extends CommandBase, R = any>(command: T): Promise<R>;
}

export interface IEventBus<EventBase extends IEvent = IEvent> {
  publish<T extends EventBase>(event: T);
  //publishAll(events: EventBase[]);
}

export type SimpleCQRSType = {
  commandBus: ICommandBus;
  eventBus: IEventBus;
};

export interface ICQRSModule {
  explore(handler: ServiceType): SimpleCQRSType;
}

@injectable()
export class CQRSModule implements ICQRSModule {
  constructor(@inject(TYPES.CommandBus) private readonly _commandBus: CommandBus, @inject(TYPES.EventBus) private readonly _eventBus: EventBus) {}

  explore(type: ServiceType): SimpleCQRSType {
    const { commands, events } = type;

    this._commandBus.register(commands);
    this._eventBus.register(events);
    return { commandBus: this._commandBus, eventBus: this._eventBus };
  }
}
