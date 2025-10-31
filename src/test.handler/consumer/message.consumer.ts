import { inject, injectable } from "inversify";
import { BrokerMessage, IBrokerPublisher } from "../../broker";
import { TYPES } from "../../type";
import { TestEvent } from "../events/event";
import { EachMessagePayload } from "kafkajs";

@injectable()
export class MessageHandlerService {

  constructor(
    @inject(TYPES.BrokerPublisher) private readonly broker: IBrokerPublisher,
  ) {}

  async subscribe() {
    await this.broker.subscribe(this);
  }

  @BrokerMessage(TestEvent.eventName)
  async handleTopic(message: any, payload: EachMessagePayload) {
    console.log(`Received message on ${TestEvent.eventName}:`, message);
    return {response: message};
  }

  @BrokerMessage("EV2")
  async handleEV1(message: any) {
    console.log(`Received message on EV2:`, JSON.stringify(message));
    return {payload: message};
  }
}