import { Observable } from './Observable'

type errorProps = {
  _hasError?: boolean
}

export class Controller<S, T> extends Observable<S & errorProps, T> {
  constructor(transport: T, initialState: S & { hasError?: boolean }) {
    super(transport, initialState)
  }

  onError(desc: any) {
    this.state._hasError = true
    console.log(desc)
    this.dispatch()
  }

  hasError(): boolean {
    return typeof this.state._hasError !== "undefined" && this.state._hasError
  }
}


