import { inject, injectable } from "inversify";
import { IKafkaBroker } from "./kafka";
import { TYPES } from "../type";

export interface IBrokerPublisher {
  publish: (event: { topic: string; payload: any }) => Promise<void>;
}

@injectable()
export class BrokerPublisher implements IBrokerPublisher {
  public constructor(@inject(TYPES.KafkaBroker) private readonly kafkaBroker: IKafkaBroker) {}

  public async publish(event: { topic: string; payload: any }): Promise<void> {
    console.log("MoleculerEventPublisher publish: " + JSON.stringify(event));
    await this.kafkaBroker.send(event.topic, [{ key: event.payload.id, value: JSON.stringify(event.payload) }]);
  }
}
