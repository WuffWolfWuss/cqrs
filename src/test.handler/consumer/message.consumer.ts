import { BrokerMessage } from ".";
import { TestEvent } from "../events/event";
import { EachMessagePayload } from "kafkajs";

export class MessageHandlerService {

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