const TYPES = {
  CQRSModule: Symbol.for("CQRSModule"),
  CommandBus: Symbol.for("CommandBus"),
  EventBus: Symbol.for("EventBus"),
  Container: Symbol.for("Container"),
  KafkaBroker: Symbol.for("KafkaBroker"),
  EventPublisher: Symbol.for("EventPublisher")
};

export { TYPES };
