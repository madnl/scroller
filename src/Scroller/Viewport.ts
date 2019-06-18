import VerticalSegment from './VerticalSegment';

export interface ViewportContainer {
  addScrollListener(callback: () => void): void;
  removeScrollListener(callback: () => void): void;
  clientTop(): number;
  height(): number;
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
      },

      clientTop() {
        return 0;
      },

      height() {
        return wnd.innerHeight;
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

  segment(): VerticalSegment {
    return new VerticalSegment(
      this.container.clientTop(),
      this.container.height()
    );
  }
}
