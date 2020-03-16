type Listener = (...args: any[]) => void;

export class EventEmitter {
  private events: { [event: string]: Set<Listener> } = {};

  getListeners(event: string) {
    if (typeof this.events[event] === 'undefined') {
      this.events[event] = new Set();
    }
    return this.events[event];
  }

  on(event: string, listener: Listener) {
    this.getListeners(event).add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: Listener) {
    this.getListeners(event).delete(listener);
  }

  emit(event: string, ...args: any[]) {
    this.getListeners(event).forEach(listener => listener.apply(this, args));
  }

  once(event: string, listener: Listener) {
    const off = this.on(event, (...args) => {
      off();
      listener.apply(this, args);
    });
  }
}
