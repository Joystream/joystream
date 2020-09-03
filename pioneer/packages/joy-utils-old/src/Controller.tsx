import { Observable } from './Observable';

type errorProps = {
  _hasError?: boolean;
}

export class Controller<S, T> extends Observable<S & errorProps, T> {
  onError (desc: any) {
    this.state._hasError = true;
    console.log(desc);
    this.dispatch();
  }

  hasError (): boolean {
    return this.state._hasError === true;
  }
}
