export default class VerticalSegment {
  readonly top: number;
  readonly height: number;

  constructor(top: number, height: number) {
    this.top = top;
    this.height = height;
  }

  get bottom(): number {
    return this.top + this.height;
  }

  translateBy(offset: number): VerticalSegment {
    return new VerticalSegment(this.top + offset, this.height);
  }

  overlapsWith(other: VerticalSegment): boolean {
    return (
      this.contains(other.top) ||
      this.contains(other.bottom) ||
      other.contains(this.top)
    );
  }

  isEqualTo(another: VerticalSegment): boolean {
    return this.top === another.top && this.height === another.height;
  }

  contains(coordinate: number) {
    return this.top <= coordinate && coordinate < this.bottom;
  }
}
