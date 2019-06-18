import * as React from 'react';
import Runway, { RunwayRef } from './Runway';
import Cell, { CellRef } from './Cell';
import { Item } from './types';
import recalculateRendition from './recalculateRendition';
import VerticalSegment from './VerticalSegment';
import HeightCache from './HeightCache';
import Viewport, { EventSubscription } from './Viewport';

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
  private scrollSubscription: EventSubscription | void = undefined;

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
    this.scrollSubscription = this.viewport.listenOnScroll(this.handleScroll);
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

  private handleScroll = () => {};

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
    scheduleFrame(() => {
      this.recordNewHeights();
      this.refreshRendition();
    });
  }

  private recordNewHeights() {
    this.state.rendition.forEach(({ item }) => {
      const cell = this.cells.get(item.key);
      if (cell) {
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

const scheduleFrame = (callback: () => void): void => {
  // TODO: prevent double scheduling
  window.requestAnimationFrame(callback);
};

const getViewport = () => {
  // TODO: abstract
  const windowHeight = window.innerHeight;
  return new VerticalSegment(0, windowHeight);
};
