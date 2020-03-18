type Listener = (...args: any[]) => void;

export class EventEmitter<T extends string> {
  private events: { [event: string]: Set<Listener> } = {};

  getListeners(event: string) {
    if (typeof this.events[event] === 'undefined') {
      this.events[event] = new Set();
    }
    return this.events[event];
  }

  on(event: T, listener: Listener) {
    this.getListeners(event).add(listener);
    return () => this.off(event, listener);
  }

  off(event: T, listener: Listener) {
    this.getListeners(event).delete(listener);
  }

  emit(event: T, ...args: any[]) {
    this.getListeners(event).forEach(listener => listener.apply(this, args));
  }

  once(event: T, listener: Listener) {
    const off = this.on(event, (...args) => {
      off();
      listener.apply(this, args);
    });
  }
}
