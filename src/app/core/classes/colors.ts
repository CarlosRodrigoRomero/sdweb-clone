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

  static rgbToHex(rgb: string) {
    return `#${rgb
      .match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
      .slice(1)
      .map((n) => parseInt(n, 10).toString(16).padStart(2, '0'))
      .join('')}`;
  }

  static rgbaToHex(rgba: string) {
    // Convertir la cadena RGBA en un arreglo de valores
    const values = rgba.slice(5, -1).split(',');
    const red = Number(values[0]);
    const green = Number(values[1]);
    const blue = Number(values[2]);
    const alpha = parseFloat(values[3]);

    // Asegurarse de que los valores estén dentro del rango correcto
    const validRed = Math.max(0, Math.min(255, red));
    const validGreen = Math.max(0, Math.min(255, green));
    const validBlue = Math.max(0, Math.min(255, blue));
    const validAlpha = Math.max(0, Math.min(1, alpha));

    // Convertir los valores en hexadecimal
    const hexRed = validRed.toString(16).padStart(2, '0');
    const hexGreen = validGreen.toString(16).padStart(2, '0');
    const hexBlue = validBlue.toString(16).padStart(2, '0');
    const hexAlpha = Math.round(validAlpha * 255)
      .toString(16)
      .padStart(2, '0');

    // Concatenar los valores
    const hex = `#${hexRed}${hexGreen}${hexBlue}${hexAlpha}`;
    return hex;
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
    } else if (gradiente <= 40) {
      return this.hexToRgb(COLOR.colores_severity[1], opacity);
    } else {
      return this.hexToRgb(COLOR.colores_severity[2], opacity);
    }
  }

  static getColorTipo(tipo: number): string {
    return COLOR.colores_tipos[tipo];
  }

  static getColorComentarios(checked: boolean, opacity: number): string {
    if (checked) {
      return this.hexToRgb(COLOR.colores_comentarios[0], opacity);
    } else {
      return this.hexToRgb(COLOR.colores_comentarios[1], opacity);
    }
  }
}
