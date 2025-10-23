import { inject, injectable } from "inversify";
import { BrokerEvent, IKafkaBroker } from "../broker/kafka";
import { TestEvent } from "./event";
import { EachMessagePayload } from "kafkajs";
import { TYPES } from "../type";

@injectable()
export class EventHandlerService {
  constructor(
    @inject(TYPES.KafkaBroker) private readonly kafkaBroker: IKafkaBroker
  ) {}

  @BrokerEvent(TestEvent.eventName)
  async handleExactTopic(message: any, payload: EachMessagePayload) {
    console.log(`Received message on ${TestEvent.eventName}:`, message);
    console.log('Partition:', payload.partition, 'Offset:', payload.message.offset);
  }
}