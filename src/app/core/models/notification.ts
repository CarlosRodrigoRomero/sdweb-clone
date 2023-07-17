import { PlantaInterface } from './planta';

export interface Notification {
  content: string;
  plants: PlantaInterface[];
  value?: number;
}
