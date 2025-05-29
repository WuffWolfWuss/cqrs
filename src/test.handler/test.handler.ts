import { injectable } from "inversify";
import { CommandHandler } from "../decorators/command-handler";
import { TestCommand } from "./test.command";

@injectable()
@CommandHandler(TestCommand)
export class TestHandler {
  public constructor() {}

  public async execute(command: TestCommand): Promise<any> {
    console.log("TestHandler executing...");
    console.log(`Command values: ${JSON.stringify(command)}`);
  }
}
