export class DataScaler {
  constructor() {
    this.minX = 0;
    this.maxX = 1;
    this.minY = 0;
    this.maxY = 1;
  }

  fit(data) {
    if (!data || data.length === 0) return;
    this.minX = Math.min(...data.map(d => d.x));
    this.maxX = Math.max(...data.map(d => d.x));
    if (this.minX === this.maxX) this.maxX = this.minX + 1;

    this.minY = Math.min(...data.map(d => d.y));
    this.maxY = Math.max(...data.map(d => d.y));
    if (this.minY === this.maxY) this.maxY = this.minY + 1;
  }

  scale(data) {
    return data.map(d => ({
      x: this.scaleX(d.x),
      y: this.scaleY(d.y)
    }));
  }

  // Scale to [-1, 1] range to avoid vanishing gradients
  scaleX(x) {
    return ((x - this.minX) / (this.maxX - this.minX)) * 2 - 1;
  }

  scaleY(y) {
    return ((y - this.minY) / (this.maxY - this.minY)) * 2 - 1;
  }

  inverseScaleY(yScaled) {
    return ((yScaled + 1) / 2) * (this.maxY - this.minY) + this.minY;
  }
}
