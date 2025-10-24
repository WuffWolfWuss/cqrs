import { TestEvent } from "./event";
import { EachMessagePayload } from "kafkajs";
import { CreateBrokerMessage } from "../broker/nats";
import { CQRSContainer } from "../container";

export const BrokerMessage = CreateBrokerMessage(CQRSContainer)

export class MessageHandlerService {

  @BrokerMessage(TestEvent.eventName)
  async handleTopic(message: any, payload: EachMessagePayload) {
    console.log(`Received message on ${TestEvent.eventName}:`, message);
    return {response: "OK"};
  }
}