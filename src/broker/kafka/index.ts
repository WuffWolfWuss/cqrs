import { injectable, postConstruct } from "inversify";
import { Consumer, EachMessagePayload, Kafka, Partitioners, Producer, ProducerRecord } from "kafkajs";
import { KAFKA_HANDLER_METADATA_KEY, KafkaSubscription } from "../constants";

interface IEventPayload {
  handler: (payload: EachMessagePayload) => Promise<void>
  retries?: number
}
export interface IKafkaBroker {
  send(topic: string, messages: { key?: string; value: string }[]): Promise<void>;
  subscribe(topic: string, payload: IEventPayload): Promise<void>;
  disconnect(): Promise<void>;
  setupKafkaSubscriptions(instance: any): Promise<void>;
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
      createPartitioner: Partitioners.LegacyPartitioner,
      metadataMaxAge: 30000,
    });
    this.consumer = this.kafka.consumer({ 
      groupId: "my-cqrs-app-group", 
      allowAutoTopicCreation: true,
      metadataMaxAge: 30000,
      retry: {
        initialRetryTime: 300,
        maxRetryTime: 10000,
        retries: 3,
      }, 
    });
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
  async send(topic: string, messages: { key?: string; value: any }[]): Promise<void> {
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

  async subscribe(topic: string, payload: IEventPayload): Promise<void> {
    await this.initialize();
    try {
      await this.kafka.admin().fetchTopicMetadata({ topics: [topic] })

      this.handlers.set(topic, payload.handler);

      await this.consumer.subscribe({
        topics: [topic],
        fromBeginning: true,
      });
      await this.startConsumer();
    } catch (error) {
      if (error.type === 'UNKNOWN_TOPIC_OR_PARTITION' || error.code === 3) {
        await this.retrySubcribe(topic, payload);
        return;
      }
      console.error(`Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    this.initialized = false;
    this.consumerRunning = false;
  }

  async setupKafkaSubscriptions(instance: any) {
  const ctor = instance.constructor;
  const subscriptions: KafkaSubscription[] = 
    Reflect.getMetadata(KAFKA_HANDLER_METADATA_KEY, ctor) || [];

  for (const { topic, handler } of subscriptions) {
    const method = instance[handler];
    if (typeof method !== 'function') {
      throw new Error(`Handler ${handler} is not a function on ${ctor.name}`);
    }

    await this.subscribe(topic, { handler: async (payload: EachMessagePayload) => {
      const messageValue = payload.message.value
        ? JSON.parse(payload.message.value.toString())
        : null;

      try {
        // Call on the actual instance
        await method.call(instance, messageValue, payload);
      } catch (error) {
        console.error(`Error in Kafka handler ${handler} for topic ${topic}:`, error);
      }
    }});
  };}

  private async retrySubcribe(
    topic: string, 
    payload: IEventPayload, 
  ): Promise<void> {

    if(!payload.retries) {
      payload.retries = 0;
    }

    payload.retries++;
    if (payload.retries > 3) {
      console.error(`Maximum retry`);
      return;
    }

    const retryTime = 1000 * Math.pow(2, payload.retries);

    setTimeout(() => {
      this.subscribe(topic, payload);
    }, retryTime);
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

export function BrokerEvent(topic: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // Collect subscriptions on the class
    const subscriptions: KafkaSubscription[] = 
    Reflect.getMetadata(KAFKA_HANDLER_METADATA_KEY, target.constructor) || [];
    subscriptions.push({ topic, handler: propertyKey });
    Reflect.defineMetadata(KAFKA_HANDLER_METADATA_KEY, subscriptions, target.constructor);
    // Return original descriptor (no modification needed)
    return descriptor;
  };
}


