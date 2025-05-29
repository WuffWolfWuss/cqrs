import { ICommand } from "../command.bus";
import { COMMAND_HANDLER_METADATA } from "./constants";

export const CommandHandler = (command: ICommand): ClassDecorator => {
  return (target: Function) => {
    // Store the command class as metadata on the handler class
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA, command, target);
  };
};
