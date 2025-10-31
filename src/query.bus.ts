import { Container, inject, injectable } from "inversify";
import { ObservableBus } from "./rxjs-util/observable-bus";
import { QUERIES_HANDLER_METADATA } from "./decorators/constants";
import { TYPES } from "./type";
import { Type } from "./interface";

export interface IQuery {}
export interface IQueryPublisher<QueryBase extends IQuery> {
  publish<T extends QueryBase>(query: T): any;
}
export type QueryHandlerType = Type<IQueryHandler<IQuery>>;
export interface IQueryHandler<TQuery extends IQuery = any, TResult = any> {
  execute(query: TQuery): Promise<TResult>;
}

@injectable()
export class QueryBus<QueryBase extends IQuery = IQuery> extends ObservableBus<QueryBase> {
  private readonly handlers = new Map<Function, any>();
  constructor(@inject(TYPES.Container) private readonly container: Container) {
    super();
  }

  execute<T extends QueryBase, R = any>(queryInstance: T): Promise<R> {
    // Get the query's class (constructor)
    const queryClass = Object.getPrototypeOf(queryInstance).constructor;
    const handlerClass = this.handlers.get(queryClass);
    if (!handlerClass) {
      throw new Error(`No handler registered for query ${queryClass.name}`);
    }

    const handler: IQueryHandler<T> = this.container.get(handlerClass);
    return handler.execute(queryInstance);
  }

  register(handlerClasses: QueryHandlerType[] = []) {
    handlerClasses.forEach((handler) => {
      const queryClass = Reflect.getMetadata(QUERIES_HANDLER_METADATA, handler);
      if (!queryClass) {
        throw new Error(`No query found for handler ${handler.name}`);
      }

      if (!this.container.isBound(handler)) {
        this.container.bind(handler).toSelf();
      }
      // Store the query-to-handler mapping
      this.handlers.set(queryClass, handler);
    });
  }
}
