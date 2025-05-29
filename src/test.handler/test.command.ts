import { ICommand } from "../command.bus";

export class TestCommand implements ICommand {
  public readonly id: string;
  public constructor(props: TestCommand) {
    Object.assign(this, props);
  }
}
