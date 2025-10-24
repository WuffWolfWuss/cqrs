import { inject, injectable } from "inversify";
import { BrokerEvent, IKafkaBroker } from "../broker/kafka";
import { TestEvent } from "./event";
import { EachMessagePayload } from "kafkajs";
import { HANDLER_METADATA_KEY } from "../broker/constants";
import { TYPES } from "../type";
@injectable()
export class EventHandlerService {
  constructor(
    @inject(TYPES.KafkaBroker) private readonly kafkaBroker: IKafkaBroker,
  ) {}

  async registerHandlers() {
    const handlers = Reflect.getMetadata(HANDLER_METADATA_KEY, this.constructor) || [];
    for (const { topic, method } of handlers) {
      await this.kafkaBroker.subscribe(topic, async (payload: EachMessagePayload) => {
        const messageValue = payload.message.value
          ? JSON.parse(payload.message.value.toString())
          : null;
        // Call the handler method
        await (this as any)[method](messageValue, payload);
      });
    }
  }

  @BrokerEvent(TestEvent.eventName)
  async handleExactTopic(message: any, payload: EachMessagePayload) {
    console.log(`Received message on ${TestEvent.eventName}:`, message);
    console.log('Partition:', payload.partition, 'Offset:', payload.message.offset);
  }
}