export class MathOperations {
  static average(values: number[]): number {
    const sum = this.sumArray(values);

    const avg = sum / values.length;
    return avg;
  }

  static sumArray(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
  }

  static weightedAverage(values: number[], weights: number[]): number {
    const result = values
      .map((value, i) => {
        const weight = weights[i];
        const sum = value * weight;

        return [sum, weight];
      })
      .reduce(
        (p, c) => {
          return [p[0] + c[0], p[1] + c[1]];
        },
        [0, 0]
      );

    return result[0] / result[1];
  }

  static standardDeviation(values: number[]): number {
    const avg = this.average(values);

    const squareDiffs = values.map((value) => {
      const diff = value - avg;
      const sqrDiff = diff * diff;
      return sqrDiff;
    });

    const avgSquareDiff = this.average(squareDiffs);

    const stdDev = Math.sqrt(avgSquareDiff);

    return stdDev;
  }

  // desviacion media absoluta, para que no afecten los extremos a la desviacion
  static DAM(values: number[], average: number): number {
    let sumDesvs = 0;
    values.forEach((value) => {
      sumDesvs = sumDesvs + Math.abs(value - average);
    });

    return sumDesvs / values.length;
  }
}
