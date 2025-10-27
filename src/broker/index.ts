import { inject, injectable } from "inversify";
import { IKafkaBroker } from "./kafka";
import { INatsBroker } from "./nats";
import { TYPES } from "../type";
export interface IBrokerPublisher {
  publish: (event: { topic: string; payload: any }) => Promise<void>;
  send: (msg: { topic: string; payload: any }) => Promise<void>;
  shutdown: () => Promise<void>;
}

@injectable()
export class BrokerPublisher implements IBrokerPublisher {
  public constructor(
    @inject(TYPES.KafkaBroker) private readonly kafkaBroker: IKafkaBroker,
    @inject(TYPES.NatsBroker) private readonly nats: INatsBroker
  ) {}

  public async publish(event: { topic: string; payload: any }): Promise<void> {
    console.log("EventPublisher publish: " + JSON.stringify(event));
    await this.kafkaBroker.send(event.topic, [{ key: event.payload.id, value: JSON.stringify(event.payload) }]);
  }

  public async send(msg: { topic: string; payload: any }): Promise<void> {
    console.log("MessagePublisher publish: " + JSON.stringify(msg));
    return this.nats.send(msg.topic, msg.payload);
  }

  public async shutdown() {
    console.log("BrokerPublisher shutting down...");
    await this.kafkaBroker.disconnect();
    console.log("Kafka disconnect...");
    await this.nats.disconnect();
    console.log("Nats disconnect...");
  }
}

export { BrokerEvent, IKafkaBroker } from "./kafka";
