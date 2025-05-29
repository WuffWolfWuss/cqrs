import { Observable, Subject } from "rxjs";

export class ObservableBus<T> {
  private readonly _subject = new Subject<T>();
  private readonly _observable: Observable<T> = this._subject.asObservable();

  get observable(): Observable<T> {
    return this._observable;
  }

  next(value: T): void {
    this._subject.next(value);
  }
}
