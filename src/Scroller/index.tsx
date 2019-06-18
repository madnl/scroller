import * as React from 'react';
import Runway, { RunwayRef } from './Runway';
import Cell, { CellRef } from './Cell';
import { Item, ItemKey } from './types';
import recalculateRendition from './recalculateRendition';
import VerticalSegment from './VerticalSegment';
import HeightCache from './HeightCache';
import Viewport, { EventSubscription } from './Viewport';
import WorkQueue, { Priority } from './WorkQueue';

type Props = {
  itemHeightEstimate: number;
  list: ReadonlyArray<Item>;
  viewport: Viewport;
};

type State = {
  rendition: ReadonlyArray<{ item: Item; offset: number }>;
  runwayHeight: number;
};

enum Task {
  MeasureItems,
  RecalculateRendition,
  Normalize,
  SampleScrollOffset,
  SampleViewportSize
}

export default class Scroller extends React.PureComponent<Props, State> {
  private readonly heightCache: HeightCache;
  private readonly cells: Map<string, CellRef>;
  private runway: RunwayRef | void = undefined;
  private readonly viewport: Viewport;
  private viewportSegment: VerticalSegment | void = undefined;
  private runwaySegment: VerticalSegment | void = undefined;
  private scrollSubscription: EventSubscription | void = undefined;
  private readonly workQueue: WorkQueue<Task>;
  private readonly itemRemeasuringQueue: Set<ItemKey> = new Set();

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

  private updateCycle(workload: ReadonlySet<Task>) {
    let heightInfoUpdated = false;
    let previousViewportSegment = this.viewportSegment;
    if (!previousViewportSegment || workload.has(Task.SampleViewportSize)) {
      this.viewportSegment = this.viewport.segment();
    }
    const previousRunwaySegment = this.runwaySegment;
    if (
      this.runway &&
      (this.viewportSegment !== previousViewportSegment ||
        workload.has(Task.SampleScrollOffset) ||
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
    if (relativeViewportSegment && workload.has(Task.MeasureItems)) {
      this.measureItems();
      heightInfoUpdated = true; // TODO: verify
    }
    if (
      relativeViewportSegment &&
      (workload.has(Task.RecalculateRendition) ||
        heightInfoUpdated ||
        !previousRelativeViewportSegment ||
        !relativeViewportSegment.isEqualTo(previousRelativeViewportSegment))
    ) {
      this.refreshRendition();
    }
    // TODO: should also include criticality check
    if (workload.has(Task.Normalize)) {
      this.normalize();
    }
  }

  private normalize() {
    // TODO
  }

  private handleScroll() {
    this.workQueue.enqueue(Task.SampleScrollOffset, Priority.Immediate);
  }

  private handleItemHeightChange = (key: ItemKey) => {
    this.itemRemeasuringQueue.add(key);
    this.workQueue.enqueue(Task.MeasureItems, Priority.Immediate);
  };

  private postRenderProcessing() {
    this.workQueue.enqueue(Task.MeasureItems, Priority.Immediate);
  }

  private measureItems() {
    this.state.rendition.forEach(({ item }) => {
      const cell = this.cells.get(item.key);
      if (
        cell &&
        (this.itemRemeasuringQueue.has(item.key) ||
          !this.heightCache.hasRecord(item.key))
      ) {
        this.heightCache.update(item.key, cell.measureHeight());
      }
    });
    this.itemRemeasuringQueue.clear();
  }

  private setRunway = (runway: RunwayRef | void) => {
    this.runway = runway;
  };

  private refreshRendition() {
    if (!this.runwaySegment || !this.viewportSegment) {
      return;
    }
    this.setState({
      rendition: recalculateRendition({
        currentRendition: this.state.rendition,
        list: this.props.list,
        viewport: viewportSegmentRelativeTo(
          this.runwaySegment,
          this.viewportSegment
        ),
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
