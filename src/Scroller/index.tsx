import * as React from 'react';
import Runway, { RunwayRef } from './Runway';
import Cell, { CellRef } from './Cell';
import { Item, ItemKey } from './types';
import recalculateRendition from './recalculateRendition';
import VerticalSegment from './VerticalSegment';
import HeightCache from './HeightCache';
import Viewport, { EventSubscription } from './Viewport';
import WorkQueue, { Priority, Workload } from './WorkQueue';

type Props = {
  itemHeightEstimate: number;
  list: ReadonlyArray<Item>;
  viewport: Viewport;
};

type State = {
  rendition: ReadonlyArray<{ item: Item; offset: number }>;
  runwayHeight: number;
};

export default class Scroller extends React.PureComponent<Props, State> {
  private readonly heightCache: HeightCache;
  private readonly cells: Map<string, CellRef>;
  private runway: RunwayRef | void = undefined;
  private readonly viewport: Viewport;
  private viewportSegment: VerticalSegment | void = undefined;
  private runwaySegment: VerticalSegment | void = undefined;
  private scrollSubscription: EventSubscription | void = undefined;
  private readonly workQueue: WorkQueue;

  constructor(props: Props) {
    super(props);
    const initialRunwayHeight = 1000;
    this.state = {
      rendition: [],
      runwayHeight: initialRunwayHeight
    };
    this.heightCache = new HeightCache(props.itemHeightEstimate);
    this.cells = new Map();
    this.viewport = props.viewport;
    this.workQueue = new WorkQueue({
      update: workload => this.updateCycle(workload),
      immediateScheduler: window.requestAnimationFrame,
      lazyScheduler: window.requestAnimationFrame
    });
  }

  render() {
    const { list: items } = this.props;
    const { runwayHeight, rendition } = this.state;
    return (
      <Runway setRef={this.setRunway} height={runwayHeight}>
        {rendition.map(({ item, offset }) => (
          <Cell
            onLayoutChange={this.handleItemHeightChange}
            setRef={this.setRef}
            offset={offset}
            item={item}
            key={item.key}
          >
            {item.node}
          </Cell>
        ))}
      </Runway>
    );
  }

  componentDidMount() {
    this.scrollSubscription = this.viewport.listenOnScroll(() =>
      this.handleScroll()
    );
    this.postRenderProcessing();
  }

  componentDidUpdate() {
    if (this.props.viewport !== this.viewport) {
      console.warn('Scroller does not support changing viewports');
    }
    this.postRenderProcessing();
  }

  componentWillUnmount() {
    if (this.scrollSubscription) {
      this.scrollSubscription.stop();
    }
  }

  private updateCycle(workload: Workload) {
    let heightInfoUpdated = false;
    let previousViewportSegment = this.viewportSegment;
    if (!previousViewportSegment || workload.sampleViewportSize) {
      this.viewportSegment = this.viewport.segment();
    }
    const previousRunwaySegment = this.runwaySegment;
    if (
      this.runway &&
      (this.viewportSegment !== previousViewportSegment ||
        workload.sampleScrollOffset ||
        !this.runwaySegment)
    ) {
      this.runwaySegment = this.runway.measureSegment();
    }
    const previousRelativeViewportSegment =
      previousRunwaySegment &&
      previousViewportSegment &&
      viewportSegmentRelativeTo(previousRunwaySegment, previousViewportSegment);
    const relativeViewportSegment =
      this.runwaySegment &&
      this.viewportSegment &&
      viewportSegmentRelativeTo(this.runwaySegment, this.viewportSegment);
    if (relativeViewportSegment && workload.measureNewItems) {
      this.measureItems(workload.remeasureItems);
      heightInfoUpdated = true; // TODO: verify
    }
    if (
      relativeViewportSegment &&
      (workload.recalculateRendition ||
        heightInfoUpdated ||
        !previousRelativeViewportSegment ||
        !relativeViewportSegment.isEqualTo(previousRelativeViewportSegment))
    ) {
      this.refreshRendition();
    }
    // TODO: should also include criticality check
    if (workload.normalize) {
      this.normalize();
    }
  }

  private normalize() {
    // TODO
  }

  private handleScroll() {
    this.workQueue.sampleScrollOffset('immediate');
  }

  private handleItemHeightChange = (key: string) => {
    scheduleFrame(() => {
      const cell = this.cells.get(key);
      if (cell) {
        this.heightCache.update(key, cell.measureHeight());
        this.refreshRendition();
      }
    });
  };

  private postRenderProcessing() {
    this.workQueue.measureNewItems('immediate');
  }

  private measureItems(remeasure: ReadonlySet<ItemKey>) {
    this.state.rendition.forEach(({ item }) => {
      const cell = this.cells.get(item.key);
      if (
        cell &&
        (remeasure.has(item.key) || !this.heightCache.hasRecord(item.key))
      ) {
        this.heightCache.update(item.key, cell.measureHeight());
      }
    });
  }

  private setRunway = (runway: RunwayRef | void) => {
    this.runway = runway;
  };

  private refreshRendition() {
    if (!this.runway) {
      return;
    }
    this.setState({
      rendition: recalculateRendition({
        currentRendition: this.state.rendition,
        list: this.props.list,
        viewport: getViewport().translateBy(-this.runway.measureSegment().top),
        heightCache: this.heightCache
      })
    });
  }

  private setRef = (key: string, ref: CellRef | void) => {
    if (ref) {
      this.cells.set(key, ref);
    } else {
      this.cells.delete(key);
    }
  };
}

const viewportSegmentRelativeTo = (
  runwaySegment: VerticalSegment,
  viewportSegment: VerticalSegment
): VerticalSegment => viewportSegment.translateBy(-runwaySegment.top);

const scheduleFrame = (callback: () => void): void => {
  // TODO: prevent double scheduling
  window.requestAnimationFrame(callback);
};

const getViewport = () => {
  // TODO: abstract
  const windowHeight = window.innerHeight;
  return new VerticalSegment(0, windowHeight);
};
