import { IQuery } from "../query.bus";
import { QUERIES_HANDLER_METADATA } from "./constants";

export const QueryHandler = (command: IQuery): ClassDecorator => {
  return (target: Function) => {
    // Store the command class as metadata on the handler class
    Reflect.defineMetadata(QUERIES_HANDLER_METADATA, command, target);
  };
};
