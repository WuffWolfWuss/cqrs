import { injectable } from "inversify";
import { Kafka, Producer, ProducerRecord } from "kafkajs";

export interface IKafkaBroker {
  send(topic: string, messages: { key?: string; value: string }[]): Promise<void>;
  disconnect(): Promise<void>;
}

@injectable()
export class KafkaBroker implements IKafkaBroker {
  private readonly kafka: Kafka;
  private readonly producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: "my-cqrs-app",
      brokers: ["localhost:29092", "localhost:29093"]
    });
    this.producer = this.kafka.producer();
  }

  // emit event here
  async send(topic: string, messages: { key?: string; value: string }[]): Promise<void> {
    try {
      await this.producer.connect();
      const record: ProducerRecord = {
        topic,
        messages: messages.map((msg) => ({
          key: msg.key || null,
          value: msg.value
        }))
      };
      await this.producer.send(record);
    } catch (error) {
      console.error(`Error sending message to Kafka topic ${topic}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}
