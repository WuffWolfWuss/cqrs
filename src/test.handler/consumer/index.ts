import { CreateBrokerEvent } from "../../broker/kafka";
import { CreateBrokerMessage } from "../../broker/nats";
import { CQRSContainer } from "../../container";

export const BrokerMessage = CreateBrokerMessage(CQRSContainer)
export const BrokerEvent = CreateBrokerEvent(CQRSContainer)