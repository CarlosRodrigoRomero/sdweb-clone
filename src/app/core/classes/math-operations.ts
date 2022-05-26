export class MathOperations {
  static average(values: number[]): number {
    const sum = values.reduce((s, value) => {
      return s + value;
    }, 0);

    const avg = sum / values.length;
    return avg;
  }
}
