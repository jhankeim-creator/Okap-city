type Handler<T> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Handler<unknown>>>();

  on<T>(event: string, handler: Handler<T>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    const set = this.listeners.get(event)!;
    set.add(handler as Handler<unknown>);
    return () => set.delete(handler as Handler<unknown>);
  }

  emit<T>(event: string, payload?: T) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of set) handler(payload as unknown);
  }

  clear() {
    this.listeners.clear();
  }
}

export const bus = new EventBus();
