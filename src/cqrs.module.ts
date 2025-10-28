import { injectable, inject } from "inversify";
import { TYPES } from "./type";
import { EventBus, EventHandlerType, IEvent } from "./event.bus";
import { IQuery, QueryBus, QueryHandlerType } from "./query.bus";
import { CommandBus, CommandHandlerType, ICommand } from "./command.bus";

export type ServiceType = Required<{
  commands: CommandHandlerType[];
  events: EventHandlerType[];
  queries: QueryHandlerType[];
}>;

export interface ICommandBus<CommandBase extends ICommand = ICommand> {
  execute<T extends CommandBase, R = any>(command: T): Promise<R>;
}

export interface IQueryBus<QueryBase extends IQuery = IQuery> {
  execute<T extends QueryBase, R = any>(command: T): Promise<R>;
}

export interface IEventBus<EventBase extends IEvent = IEvent> {
  publish<T extends EventBase>(event: T);
  //publishAll(events: EventBase[]);
}

export type SimpleCQRSType = {
  commandBus: ICommandBus;
  eventBus: IEventBus;
  queryBus: IQueryBus;
};

export interface ICQRSModule {
  explore(handler: ServiceType): SimpleCQRSType;
}

@injectable()
export class CQRSModule implements ICQRSModule {
  constructor(
    @inject(TYPES.CommandBus) private readonly _commandBus: CommandBus, 
    @inject(TYPES.EventBus) private readonly _eventBus: EventBus,
    @inject(TYPES.QueryBus) private readonly _queryBus: QueryBus
  ) {}

  explore(type: ServiceType): SimpleCQRSType {
    const { commands, events, queries } = type;

    this._commandBus.register(commands);
    this._eventBus.register(events);
    this._queryBus.register(queries);
    return { 
      commandBus: this._commandBus, 
      eventBus: this._eventBus, 
      queryBus: this._queryBus  
    };
  }
}
