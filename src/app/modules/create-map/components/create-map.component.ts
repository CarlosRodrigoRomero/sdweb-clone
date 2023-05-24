import { Component, OnInit } from '@angular/core';

import { Coordinate } from 'ol/coordinate';

import { CreateMapService } from '@data/services/create-map.service';
import { MapImagesService } from '@data/services/map-images.service';

import { MapImage } from '@core/models/mapImages';

@Component({
  selector: 'app-create-map',
  templateUrl: './create-map.component.html',
  styleUrls: ['./create-map.component.css'],
})
export class CreateMapComponent implements OnInit {
  dataLoaded = false;
  mapImages: MapImage[] = [];

  constructor(private createMapService: CreateMapService, private mapImagesService: MapImagesService) {}

  ngOnInit(): void {
    this.createMapService.initService().then((initService) => {
      this.dataLoaded = initService;

      this.generateRandomMapImages();
    });
  }

  private generateRandomMapImages(): void {
    const coordsPlanta = [this.createMapService.planta.longitud, this.createMapService.planta.latitud];

    const topLeft = [coordsPlanta[0] - 0.004, coordsPlanta[1] + 0.002] as Coordinate;
    const bottomRight = [coordsPlanta[0] + 0.004, coordsPlanta[1] - 0.002] as Coordinate;

    const randomMapImages: MapImage[] = [];
    for (let index = 0; index < 1000; index++) {
      const randomPoint = this.randomGpsPoint(topLeft, bottomRight);
      const mapImage: MapImage = {
        id: index.toString(),
        coords: randomPoint,
        archivo: 'archivo',
      };
      randomMapImages.push(mapImage);
    }

    this.mapImagesService.mapImages = randomMapImages;
  }

  private randomGpsPoint(topLeft: Coordinate, bottomRight: Coordinate): Coordinate {
    const randomLongitude = topLeft[0] + Math.random() * (bottomRight[0] - topLeft[0]);
    const randomLatitude = topLeft[1] - Math.random() * (topLeft[1] - bottomRight[1]);

    return [randomLongitude, randomLatitude] as Coordinate;
  }
}
