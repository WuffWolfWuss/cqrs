import { Container, injectable } from "inversify";
import { connect } from "@nats-io/transport-node";
import { Msg, NatsConnection, StringCodec, Subscription } from "nats";
import { NATS_HANDLER_METADATA_KEY } from "../constants";
import { CQRSContainer } from "../../container";
import { TYPES } from "../../type";

export interface INatsBroker {
  send(topic: string, messages: any): Promise<void>;
  subscribe(topic: string, handler: (data: any, msg: Msg) => Promise<any>): Promise<void>;
  disconnect(): Promise<void>;
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
        callback: async (err, msg) => {
          if (err) {
            console.error(`Error in NATS subscription for ${topic}:`, err);
            return;
          }
          // Decode and parse message
          const data = msg.data ? JSON.parse(this.sc.decode(msg.data)) : null;
          try {
            const response = await handler(data, msg);
            // Reply if there's a reply subject (request-response)
            if (msg.reply) {
              const responseData = this.sc.encode(JSON.stringify(response || {}));
              msg.respond(responseData);
            }
          } catch (error) {
            console.error(`Error handling message for ${topic}:`, error);
          }
        },
      });
      this.subscriptions.set(topic, sub);
    } catch (error) {
      console.error(`Error subscribing to NATS topic ${topic}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
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
}

export function CreateBrokerMessage(container: Container) {
  return function BrokerMessage(topic: string) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor,
      ) {
      // Store instance in constructor
      const originalConstructor = target.constructor;
      const newConstructor: any = function (...args: any[]) {
        const instance = new originalConstructor(...args);
        return instance;
      };
      newConstructor.prototype = originalConstructor.prototype;
      target.constructor = newConstructor;

      const broker = container.get<INatsBroker>(TYPES.NatsBroker);
      broker.subscribe(topic, async (data: any, msg: Msg) => {
        const response = await newConstructor.prototype[propertyKey](data, msg);
        return response;
      });

      return descriptor;
    }
  }
}
