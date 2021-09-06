export interface FilterModuloBruto {
  confianzaM?: {
    min: number;
    max: number;
  };
  aspectRatioM?: {
    min: number;
    max: number;
  };
  areaM?: {
    min: number;
    max: number;
  };
  eliminados?: string[];
}
