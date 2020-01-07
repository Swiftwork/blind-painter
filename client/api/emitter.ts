type Listener = (...args: any[]) => void;
type Events = { [event: string]: Set<Listener> };

export class EventEmitter<T extends string> {
  private readonly events: Events = {};

  private getListeners(event: T) {
    if (typeof this.events[event] === 'undefined') {
      this.events[event] = new Set();
    }
    return this.events[event];
  }

  public on(event: T, listener: Listener): () => void {
    this.getListeners(event).add(listener);
    return () => this.off(event, listener);
  }

  public off(event: T, listener: Listener): void {
    this.getListeners(event).delete(listener);
  }

  public emit(event: T, ...args: any[]): void {
    this.getListeners(event).forEach(listener => listener.apply(this, args));
  }

  public once(event: T, listener: Listener): void {
    const off: () => void = this.on(event, (...args: any[]) => {
      off();
      listener.apply(this, args);
    });
  }
}
