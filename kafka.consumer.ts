import { Kafka } from "kafkajs";

// this for simulate service consumer for event emit by Kafka broker
async function runConsumer() {
  const kafka = new Kafka({
    clientId: "test-consumer",
    brokers: ["localhost:29092"]
  });

  const consumer = kafka.consumer({ groupId: "test-group" });
  await consumer.connect();
  await consumer.subscribe({ topic: "something.something", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Received message on topic ${topic}, partition ${partition}:`);
      console.log({
        key: message.key?.toString(),
        value: message.value?.toString()
      });
    }
  });
}

runConsumer().catch(console.error);

async function createTopic() {
  const kafka = new Kafka({
    clientId: "admin-client",
    brokers: ["localhost:29092"]
  });
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: [{ topic: "test-topic", numPartitions: 1, replicationFactor: 1 }]
  });
  await admin.disconnect();
}
