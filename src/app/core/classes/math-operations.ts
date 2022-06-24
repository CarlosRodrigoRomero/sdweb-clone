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

  static kmhToBeaufort(kmh: number): number {
    switch (true) {
      case kmh >= 0 && kmh <= 1:
        return 0;
      case kmh >= 2 && kmh <= 5:
        return 1;
      case kmh >= 6 && kmh <= 11:
        return 2;
      case kmh >= 12 && kmh <= 19:
        return 3;
      case kmh >= 20 && kmh <= 28:
        return 4;
      case kmh >= 29 && kmh <= 38:
        return 5;
      case kmh >= 39 && kmh <= 49:
        return 6;
      case kmh >= 50 && kmh <= 61:
        return 7;
      case kmh >= 62 && kmh <= 74:
        return 8;
      case kmh >= 75 && kmh <= 88:
        return 9;
      case kmh >= 89 && kmh <= 102:
        return 10;
      case kmh >= 103 && kmh <= 117:
        return 11;
      case kmh >= 118:
        return 12;
    }
  }

  static kmhToMs(kmh: number): number {
    return (kmh * 1000) / 3600;
  }
}
