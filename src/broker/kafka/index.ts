import { Container, injectable } from "inversify";
import { Consumer, EachMessagePayload, Kafka, Partitioners, Producer, ProducerRecord } from "kafkajs";
import { HANDLER_METADATA_KEY } from "../constants";
import { TYPES } from "../../type";

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
  private consumerRunning: boolean = false;

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
    this.consumer = this.kafka.consumer({ 
      groupId: "my-cqrs-app-group", 
      allowAutoTopicCreation: true,
      metadataMaxAge: 30000,
      retry: {
        initialRetryTime: 500,
        retries: 3,
      }, 
    });
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
    const { topics } = await this.kafka.admin().fetchTopicMetadata({ topics: [topic] })
    try {
      if (!topics.length) {
        await this.producer.send({
          topic,
          messages: [{ key: null, value: JSON.stringify({ __init: true }) }],
        });
      }

      this.handlers.set(topic, handler);

      await this.consumer.subscribe({
        topics: [topic],
        fromBeginning: true,
      });
      await this.startConsumer();
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  private async startConsumer() {
    if (this.consumerRunning) return;

    await this.consumer.run({
      eachMessage: async (payload) => {
        for (const [topicPattern, handler] of this.handlers) {
          const matches = typeof topicPattern === 'string'
            ? topicPattern === payload.topic
            : topicPattern.test(payload.topic);

          if (matches) {
            try {
              await handler(payload);
            } catch (err) {
              console.error('Handler error:', err);
            }
          }
        }
      },
    });

    this.consumerRunning = true;
  }
}

export function CreateBrokerEvent(container: Container) {
  return function BrokerEvent(topic: string) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor,
    ) {
      // Store instance in constructor
      const originalConstructor = target.constructor;

      const broker = container.get<IKafkaBroker>(TYPES.KafkaBroker);
      broker.subscribe(topic, async (payload: EachMessagePayload) => {
        const messageValue = payload.message.value
          ? JSON.parse(payload.message.value.toString())
          : null;
        // Call the handler method
        await originalConstructor.prototype[propertyKey](messageValue, payload);
      });

      // Keep original method unchanged
      return descriptor;
    };
  }
}


