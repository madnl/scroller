import * as React from 'react';
import Runway, { RunwayRef } from './Runway';
import Cell, { CellRef } from './Cell';
import { Item } from './types';
import recalculateRendition from './recalculateRendition';
import VerticalSegment from './VerticalSegment';
import HeightCache from './HeightCache';

type Props = {
  itemHeightEstimate: number;
  list: ReadonlyArray<Item>;
};

type State = {
  rendition: ReadonlyArray<{ item: Item; offset: number }>;
  runwayHeight: number;
};

export default class Scroller extends React.PureComponent<Props, State> {
  private readonly heightCache: HeightCache;
  private readonly cells: Map<string, CellRef>;
  private runway: RunwayRef | void = undefined;

  constructor(props: Props) {
    super(props);
    const initialRendition =
      props.list.length > 0 ? [{ item: props.list[0], offset: 0 }] : [];
    const initialRunwayHeight = 1000;
    this.state = {
      rendition: initialRendition,
      runwayHeight: initialRunwayHeight
    };
    this.heightCache = new HeightCache(props.itemHeightEstimate);
    this.cells = new Map();
  }

  render() {
    const { list: items } = this.props;
    const { runwayHeight, rendition } = this.state;
    return (
      <Runway setRef={this.setRunway} height={runwayHeight}>
        {rendition.map(({ item, offset }) => (
          <Cell setRef={this.setRef} offset={offset} item={item} key={item.key}>
            {item.node}
          </Cell>
        ))}
      </Runway>
    );
  }

  componentDidMount() {
    this.postRenderProcessing();
  }

  componentDidUpdate() {
    this.postRenderProcessing();
  }

  private postRenderProcessing() {
    scheduleFrame(() => {
      this.recordNewHeights();
      this.refreshRendition();
    });
  }

  private recordNewHeights() {
    this.state.rendition.forEach(({ item }) => {
      if (!this.heightCache.hasRecord(item.key)) {
        const cell = this.cells.get(item.key);
        if (cell) {
          this.heightCache.update(item.key, cell.measureHeight());
        }
      }
    });
  }

  private setRunway = (runway: RunwayRef | void) => {
    this.runway = runway;
  };

  private scheduleRenditionRecalculation() {
    // TODO: prevent double scheduling
    window.requestAnimationFrame(() => {
      this.refreshRendition();
    });
  }

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
