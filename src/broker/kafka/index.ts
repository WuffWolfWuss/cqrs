import { injectable } from "inversify";
import { Consumer, EachMessagePayload, Kafka, Partitioners, Producer, ProducerRecord } from "kafkajs";
import { HANDLER_METADATA_KEY } from "../constants";

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
    try {
      !this.initialized && await this.producer.connect();
      !this.initialized && await this.consumer.connect();
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
    // Get existing handlers or initialize array
    const handlers = Reflect.getMetadata(HANDLER_METADATA_KEY, target.constructor) || [];
    // Store topic and method name
    handlers.push({ topic, method: propertyKey });
    Reflect.defineMetadata(HANDLER_METADATA_KEY, handlers, target.constructor);

    // Keep original method unchanged
    return descriptor;
  };
}


