const TYPES = {
  CQRSModule: Symbol.for("CQRSModule"),
  CommandBus: Symbol.for("CommandBus"),
  EventBus: Symbol.for("EventBus"),
  Container: Symbol.for("Container"),
  KafkaBroker: Symbol.for("KafkaBroker"),
  BrokerPublisher: Symbol.for("BrokerPublisher"),
  EventPublisher: Symbol.for("EventPublisher"),
  ObjectFactory: Symbol.for("ObjectFactory")
};

export { TYPES };
