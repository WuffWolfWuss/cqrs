import { ICommand } from "../../command.bus";

export class MessageCommand implements ICommand {
  public readonly msg: string;
  public constructor(props: MessageCommand) {
    Object.assign(this, props);
  }
}
