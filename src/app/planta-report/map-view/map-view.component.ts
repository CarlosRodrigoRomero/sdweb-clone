import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InformeService } from '@core/services/informe.service';
import TileLayer from 'ol/layer/Tile';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import View from 'ol/View';
import { PlantaService } from '../../core/services/planta.service';
import { PlantaInterface } from '../../core/models/planta';
import { transformExtent } from 'ol/proj';

// planta prueba: egF0cbpXnnBnjcrusoeR
@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit {
  public plantaId: string;
  public planta: PlantaInterface;
  public map: Map;

  constructor(private route: ActivatedRoute, private plantaService: PlantaService) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.plantaService.getPlanta(this.plantaId).subscribe((planta) => {
      this.planta = planta;
      this.initMap();
    });
  }

  initMap() {
    // MAPA
    // let overlay = new TileLayer({
    //   source: new XYZ({
    //     url: 'https://solardrontech.es/tileserver.php?/index.json?/verdinales/{z}/{x}/{y}.png',
    //   }),
    // });

    this.map = new Map({
      target: 'map',

      layers: [
        new TileLayer({
          source: new XYZ({
            attributions: [
              'Powered by Esri',
              'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
            ],
            attributionsCollapsible: false,
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 23,
          }),
          extent: this.transform([-7.06022, 38.523619, -7.056351, 38.522765]),
        }),

        // overlay,
      ],
      view: new View({
        center: fromLonLat([this.planta.longitud, this.planta.latitud]),
        zoom: 18,
        maxZoom: 20,
        extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
      }),
    });
    this.map.add;
  }

  transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }
}
