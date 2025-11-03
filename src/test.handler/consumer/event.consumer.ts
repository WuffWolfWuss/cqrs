import { injectable } from "inversify";
import { EachMessagePayload } from "kafkajs";
import { TestEvent } from "../events/event";
import { BrokerEvent } from "../../broker";

@injectable()
export class EventHandlerService {
  constructor() {}

  @BrokerEvent(TestEvent.eventName)
  async handleExactTopic(message: any, payload: EachMessagePayload) {
    console.log(`Received event on ${TestEvent.eventName}:`, message);
    console.log('Partition:', payload.partition, 'Offset:', payload.message.offset);
  }
}