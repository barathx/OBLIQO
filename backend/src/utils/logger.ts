export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[Obliqo] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[Obliqo ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[Obliqo WARN] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Obliqo DEBUG] ${message}`, ...args);
    }
  },
};
