import { injectable } from "inversify";
import { connect, Msg, NatsConnection, Subscription } from "@nats-io/transport-node";
import { TYPES } from "../../type";
import { StringCodec } from "nats";
import { NATS_HANDLER_METADATA_KEY, NatsSubscription } from "../constants";

export interface INatsBroker {
  send(topic: string, messages: any): Promise<void>;
  subscribe(topic: string, handler: (data: any, msg: Msg) => Promise<any>): Promise<void>;
  disconnect(): Promise<void>;
  setupNatsSubscriptions(instance: any): Promise<void>;
}

@injectable()
export class NatsBroker implements INatsBroker {
  private connection: NatsConnection;
  private readonly subscriptions: Map<string, Subscription> = new Map();
  private readonly sc = StringCodec()

  constructor() {}

  private async initialize() {
    if (this.connection) return; 
    try {
      this.connection = await connect({ servers: "nats://localhost:4222" });
      this.connection.closed().then((err) => {
        if (err) console.error('NATS connection closed with error:', err);
      });
    } catch (error) {
      console.error('Failed to connect Nats server:', error);
      throw error;
    }
  }

  async send(topic: string, messages: any): Promise<void> {
    await this.initialize();
    try {
      // Encode data as JSON string
      const message = this.sc.encode(JSON.stringify(messages));
      // Request-response: Wait for reply
      const response = await this.connection.request(topic, message, { timeout: 5000 });
      // Decode response
      return JSON.parse(this.sc.decode(response.data));
    } catch (error) {
      console.error(`Error sending message to Nats topic ${topic}:`, error);
      throw error;
    }
  }

  async subscribe(topic: string, handler: (data: any, msg: Msg) => Promise<any>): Promise<void> {
    await this.initialize();
    try {
      if (this.subscriptions.has(topic)) {
        console.log(`Already subscribed to ${topic}`);
        return;
      }

      const sub = this.connection.subscribe(topic, {
        callback: (err, msg) => {
          if (err) {
            console.error(`Error in NATS subscription for ${topic}:`, err);
            return;
          }
          // Decode and parse message
          const data = msg.data ? JSON.parse(this.sc.decode(msg.data)) : null;
          void (async () => {
            try {
              const response = await handler(data, msg);
              if (msg.reply) {
                const responseData = this.sc.encode(JSON.stringify(response ?? {}));
                msg.respond(responseData);
              }
            } catch (error) {
              console.error(`Error handling message for ${topic}:`, error);
            }
          })();
        },
      });
      this.subscriptions.set(topic, sub);
    } catch (error) {
      console.error(`Error subscribing to NATS topic ${topic}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) return; 
    try {
      // Unsubscribe all subscriptions
      for (const sub of this.subscriptions.values()) {
        sub.unsubscribe();
      }
      await this.connection.drain();
      await this.connection.close();
    } catch (error) {
      console.error('Error disconnecting NATS:', error);
      throw error;
    }
  }

  async setupNatsSubscriptions(instance: any) {
    const ctor = instance.constructor;
    const subscriptions: NatsSubscription[] = 
      Reflect.getMetadata(NATS_HANDLER_METADATA_KEY, ctor) || [];
  
    for (const { topic, handler } of subscriptions) {
      const method = instance[handler];
      if (typeof method !== 'function') {
        throw new Error(`Handler ${handler} is not a function on ${ctor.name}`);
      }
  
      await this.subscribe(topic, async (data: any, msg: Msg) => {
        try {
          const response = await method.call(instance, data, msg);
          // Auto-reply if reply subject exists
          if (msg.reply && response !== undefined) {
            const encoded = this.sc.encode(JSON.stringify(response));
            msg.respond(encoded);
          }
        } catch (error) {
          console.error(`Error in Kafka handler ${handler} for topic ${topic}:`, error);
        }
      });
  };}
}

export function BrokerMessage(topic: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
    ) {
      // Collect subscriptions on the class
      const subscriptions: NatsSubscription[] = 
      Reflect.getMetadata(NATS_HANDLER_METADATA_KEY, target.constructor) || [];
      subscriptions.push({ topic, handler: propertyKey });
      Reflect.defineMetadata(NATS_HANDLER_METADATA_KEY, subscriptions, target.constructor);
      // Return original descriptor (no modification needed)
      return descriptor;
  }
}
