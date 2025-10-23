import "reflect-metadata";
import { Container, inject, injectable } from "inversify";
import { ObservableBus } from "./rxjs-util/observable-bus";
import { container } from "./container";
import { COMMAND_HANDLER_METADATA } from "./decorators/constants";
import { TYPES } from "./type";
import { Type } from "./interface";

export interface ICommand {}
export interface ICommandPublisher<CommandBase extends ICommand> {
  publish<T extends CommandBase>(command: T): any;
}
export type CommandHandlerType = Type<ICommandHandler<ICommand>>;
export interface ICommandHandler<TCommand extends ICommand = any, TResult = any> {
  execute(command: TCommand): Promise<TResult>;
}

@injectable()
export class CommandBusOLD<CommandBase extends ICommand = ICommand> extends ObservableBus<CommandBase> {
  constructor() {
    super();
  }

  execute<T extends CommandBase, R = any>(command: T): Promise<R> {
    const handlerType = Reflect.getMetadata(COMMAND_HANDLER_METADATA, command);
    const handler: ICommandHandler<T> = container.get(handlerType);
    if (!handler) {
      throw new Error("Command handler not found.");
    }
    this.next(command);
    return handler.execute(command);
  }

  register(handlers: any[] = []) {
    handlers.forEach((handler) => container.bind(handler).toSelf());
  }
}

@injectable()
export class CommandBus<CommandBase extends ICommand = ICommand> extends ObservableBus<CommandBase> {
  private readonly handlers = new Map<Function, any>();
  constructor(@inject(TYPES.Container) private readonly container: Container) {
    super();
  }

  execute<T extends CommandBase, R = any>(commandInstance: T): Promise<R> {
    // Get the command's class (constructor)
    const commandClass = Object.getPrototypeOf(commandInstance).constructor;
    const handlerClass = this.handlers.get(commandClass);
    if (!handlerClass) {
      throw new Error(`No handler registered for command ${commandClass.name}`);
    }

    const handler: ICommandHandler<T> = this.container.get(handlerClass);
    return handler.execute(commandInstance);
  }

  register(handlerClasses: CommandHandlerType[] = []) {
    handlerClasses.forEach((handler) => {
      const commandClass = Reflect.getMetadata(COMMAND_HANDLER_METADATA, handler);
      if (!commandClass) {
        throw new Error(`No command found for handler ${handler.name}`);
      }

      if (!this.container.isBound(handler)) {
        this.container.bind(handler).toSelf();
      }
      // Store the command-to-handler mapping
      this.handlers.set(commandClass, handler);
    });
  }
}
