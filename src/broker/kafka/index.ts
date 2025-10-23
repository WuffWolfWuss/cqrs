import { injectable } from "inversify";
import { Consumer, EachMessagePayload, Kafka, Partitioners, Producer, ProducerRecord } from "kafkajs";

export interface IKafkaBroker {
  send(topic: string, messages: { key?: string; value: string }[]): Promise<void>;
  subscribe(topic: string, handler: (payload: EachMessagePayload) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
}

@injectable()
export class KafkaBroker implements IKafkaBroker {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly consumer: Consumer;
  private readonly handlers: Map<string | RegExp, (payload: EachMessagePayload) => Promise<void>> = new Map();
  private initialized: boolean;

  constructor() {
    this.kafka = new Kafka({
      clientId: "my-cqrs-app",
      brokers: ["localhost:9092"], // OLD CONFIG "localhost:29092", "localhost:29093"
      retry: {
        initialRetryTime: 100,
        retries: 8
      },
    });
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      createPartitioner: Partitioners.LegacyPartitioner
    });
    this.consumer = this.kafka.consumer({ groupId: "my-cqrs-app-group", allowAutoTopicCreation: true });
    this.initialized = false;
  }

  private async initialize() {
    if (this.initialized) return;
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  // emit event here
  async send(topic: string, messages: { key?: string; value: string }[]): Promise<void> {
    await this.initialize();
    try {
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

  async subscribe(topic: string, handler: (payload: EachMessagePayload) => Promise<void>): Promise<void> {
    await this.initialize();
    try {
      this.handlers.set(topic, handler);
      await this.consumer.subscribe({
        topics: [topic],
        fromBeginning: true, // Adjust based on your CQRS needs (e.g., false for new events only)
      });
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          for (const [topicPattern, handle] of this.handlers) {
            const topicMatches =
              typeof topicPattern === 'string'
                ? topicPattern === payload.topic
                : topicPattern.test(payload.topic);
            if (topicMatches) {
              await handle(payload);
            }
          }
        },
      });
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}

export function BrokerEvent(topic: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const broker = this.kafkaBroker as IKafkaBroker;
      if (!broker) {
        throw new Error('KafkaBroker not injected');
      }
      await broker.subscribe(topic, async (payload: EachMessagePayload) => {
        // Parse message value (assuming JSON, adjust as needed)
        const messageValue = payload.message.value
          ? JSON.parse(payload.message.value.toString())
          : null;
        await originalMethod.call(this, messageValue, payload);
      });
    };
  };
}


