export interface ViewportContainer {
  addScrollListener(callback: () => void): void;
  removeScrollListener(callback: () => void): void;
}

export interface EventSubscription {
  stop(): void;
}

export default class Viewport {
  private readonly container: ViewportContainer;

  static forWindow(wnd: typeof window = window): Viewport {
    return new Viewport({
      addScrollListener(callback) {
        wnd.addEventListener('scroll', callback);
      },

      removeScrollListener(callback) {
        wnd.removeEventListener('scroll', callback);
      }
    });
  }

  constructor(container: ViewportContainer) {
    this.container = container;
  }

  listenOnScroll(listener: () => void): EventSubscription {
    this.container.addScrollListener(listener);
    return {
      stop: () => {
        this.container.removeScrollListener(listener);
      }
    };
  }
}
