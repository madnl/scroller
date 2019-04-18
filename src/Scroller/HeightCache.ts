export default class HeightCache {
  private readonly heights: Map<string, number>;
  private readonly defaultHeight: number;

  constructor(defaultHeight: number) {
    this.defaultHeight = defaultHeight;
    this.heights = new Map();
  }

  update(key: string, height: number) {
    this.heights.set(key, height);
  }

  get(key: string): number {
    const height = this.heights.get(key);
    return typeof height === 'number' ? height : this.defaultHeight;
  }

  hasRecord(key: string): boolean {
    return this.heights.has(key);
  }
}
