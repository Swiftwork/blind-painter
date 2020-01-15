class EventEmitter {
  constructor() {
    this.events = {};
  }

  getListeners(event) {
    if (typeof this.events[event] === 'undefined') {
      this.events[event] = new Set();
    }
    return this.events[event];
  }

  on(event, listener) {
    this.getListeners(event).add(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    this.getListeners(event).delete(listener);
  }

  emit(event, ...args) {
    this.getListeners(event).forEach(listener => listener.apply(this, args));
  }

  once(event, listener) {
    const off = this.on(event, (...args) => {
      off();
      listener.apply(this, args);
    });
  }
}

module.exports = { EventEmitter };
