import { COLOR } from '@data/constants/color';

export class Colors {
  static hexToRgb(hex: string, opacity: number): string {
    return (
      'rgba(' +
      hex
        .replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1)
        .match(/.{2}/g)
        .map((x) => parseInt(x, 16))
        .toString() +
      ',' +
      opacity.toString() +
      ')'
    );
  }

  static getColor(value: number, range: number[], opacity: number): string {
    if (value < range[0]) {
      return Colors.hexToRgb(COLOR.colores_severity[0], opacity);
    } else if (value <= range[1]) {
      return Colors.hexToRgb(COLOR.colores_severity[1], opacity);
    } else {
      return Colors.hexToRgb(COLOR.colores_severity[2], opacity);
    }
  }

  static getColorPerdidas(perdidas: number, opacity: number): string {
    if (perdidas < 0.3) {
      return this.hexToRgb(COLOR.colores_severity[0], opacity);
    } else if (perdidas <= 0.5) {
      return this.hexToRgb(COLOR.colores_severity[1], opacity);
    } else {
      return this.hexToRgb(COLOR.colores_severity[2], opacity);
    }
  }

  static getColorGradNormMax(gradiente: number, opacity: number): string {
    if (gradiente < 10) {
      return this.hexToRgb(COLOR.colores_severity[0], opacity);
    } else if (gradiente <=  40) {
      return this.hexToRgb(COLOR.colores_severity[1], opacity);
    } else {
      return this.hexToRgb(COLOR.colores_severity[2], opacity);
    }
  }
}
