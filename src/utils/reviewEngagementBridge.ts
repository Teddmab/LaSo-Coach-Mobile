type Listener = () => void;

const listeners = new Set<Listener>();

export const reviewEngagementBridge = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  notify(): void {
    listeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
  },
};
