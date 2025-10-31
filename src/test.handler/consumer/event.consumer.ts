import { inject, injectable } from "inversify";
import { EachMessagePayload } from "kafkajs";
import { TestEvent } from "../events/event";
import { BrokerEvent, IBrokerPublisher } from "../../broker";
import { TYPES } from "../../type";

@injectable()
export class EventHandlerService {
  constructor() {}

  @BrokerEvent(TestEvent.eventName)
  async handleExactTopic(message: any, payload: EachMessagePayload) {
    console.log(`Received event on ${TestEvent.eventName}:`, message);
    console.log('Partition:', payload.partition, 'Offset:', payload.message.offset);
  }
}