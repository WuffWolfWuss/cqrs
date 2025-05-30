import { inject, injectable } from "inversify";
import { CommandHandler } from "../decorators/command-handler";
import { TestCommand } from "./test.command";
import { TYPES } from "../type";
import { ObjectFactory } from "../eventPub/object.factory";
import { TestEvent } from "./event";

@injectable()
@CommandHandler(TestCommand)
export class TestHandler {
  public constructor(@inject(TYPES.ObjectFactory) private readonly objectFactory: ObjectFactory) {}

  public async execute(command: TestCommand): Promise<any> {
    console.log("TestHandler executing...");
    console.log(`Command values: ${JSON.stringify(command)}`);

    const obj = this.objectFactory.create({ id: command.id });
    //obj.publish(new TestEvent({ id: "EV01", message: "EVENT SENDING" }));

    return { success: true };
  }
}
