import { inject, injectable } from "inversify";
import { CommandHandler } from "../../decorators/command-handler";
import { TYPES } from "../../type";
import { MessageCommand } from "./message.command";
import { IBrokerPublisher } from "../../broker";

@injectable()
@CommandHandler(MessageCommand)
export class MessageHandler {
  public constructor(@inject(TYPES.BrokerPublisher) private readonly broker: IBrokerPublisher) {}

  public async execute(command: MessageCommand): Promise<any> {
    const result = await this.broker.send({
      topic: "EV2",
      payload: { msg: command.msg }
    });

    return result;
  }
}
