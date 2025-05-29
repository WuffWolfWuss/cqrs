import { IEvent } from "../event.bus";
import { EVENTS_HANDLER_METADATA } from "./constants";

export const EventsHandler = (event: IEvent): ClassDecorator => {
  return (target: Function) => {
    Reflect.defineMetadata(EVENTS_HANDLER_METADATA, event, target);
  };
};
