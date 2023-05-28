import { Component, OnDestroy, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { Map } from 'ol';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control.js';
import { OSM } from 'ol/source';
import { DoubleClickZoom } from 'ol/interaction';

import { OlMapService } from '@data/services/ol-map.service';
import { StructuresService } from '@data/services/structures.service';
import { ThermalService } from '@data/services/thermal.service';
import { StructuresControlService } from '@data/services/structures-control.service';

import { PlantaInterface } from '@core/models/planta';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { RawModule } from '@core/models/moduloBruto';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-map-structures',
  templateUrl: './map-structures.component.html',
  styleUrls: ['./map-structures.component.css'],
})
export class MapStructuresComponent implements OnInit, OnDestroy {
  private planta: PlantaInterface;
  private informe: InformeInterface;
  private map: Map;
  public thermalSource;
  private thermalLayer: TileLayer<any>;
  private thermalLayerDB: ThermalLayerInterface;
  public layerVisibility = true;
  endFilterSubscription = false;
  rawModHovered: RawModule;
  private aerialLayer: TileLayer<any>;

  private subscriptionFilters: Subscription = new Subscription();
  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private structuresService: StructuresService,
    private thermalService: ThermalService,
    private structuresControlService: StructuresControlService
  ) {}

  ngOnInit(): void {
    this.planta = this.structuresService.planta;
    this.informe = this.structuresService.informe;

    this.subscriptions.add(
      this.structuresService.endFilterSubscription$.subscribe((end) => {
        if (end) {
          this.subscriptionFilters.unsubscribe();
        }
      })
    );

    // añadimos las ortofotos aereas de cada informe
    this.olMapService.addAerialLayer(this.informe);

    this.thermalService
      .getReportThermalLayerDB(this.informe.id)
      .pipe(take(1))
      .subscribe((layersDB) => {
        // nos suscribimos a las capas termica y visual del mapa
        this.subscriptions.add(
          combineLatest([this.olMapService.getThermalLayers(), this.olMapService.aerialLayers$]).subscribe(
            ([tLayers, vLayers]) => {
              this.thermalLayer = tLayers[0];

              this.aerialLayer = vLayers[0];

              if (this.aerialLayer !== undefined) {
                this.aerialLayer.setProperties({ name: 'aerial' });
              }

              if (this.thermalLayer !== undefined && this.aerialLayer !== undefined) {
                console.log('.');
                this.initMap();
              }
            }
          )
        );

        // esta es la thermalLayer de la DB
        this.thermalLayerDB = layersDB[0];

        if (this.thermalLayerDB !== undefined) {
          const tL = this.olMapService.createThermalLayer(this.thermalLayerDB, this.informe, 0);

          tL.setProperties({
            informeId: this.informe.id,
          });

          this.olMapService.addThermalLayer(tL);
        }
      });

    this.subscriptions.add(
      this.structuresControlService.rawModHovered$.subscribe((rawMod) => (this.rawModHovered = rawMod))
    );
  }

  initMap() {
    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    osmLayer.setProperties({ name: 'osm' });

    const layers = [osmLayer, this.aerialLayer, this.thermalLayer];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom - 2,
      maxZoom: 24,
    });

    this.olMapService.createMap('map', layers, view, defaultControls({ attribution: false })).subscribe((map) => {
      this.map = map;

      // desactivamos el zoom al hacer dobleclick para que no interfiera
      this.map.getInteractions().forEach((interaction) => {
        if (interaction instanceof DoubleClickZoom) {
          this.map.removeInteraction(interaction);
        }
      });
    });
  }

  setLayerVisibility() {
    this.layerVisibility = !this.layerVisibility;
    this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer.getProperties().id === undefined ||
          (layer.getProperties().id !== 'rawModLayer' && layer.getProperties().id !== 'normModLayer')
      )
      .forEach((layer) => layer.setVisible(this.layerVisibility));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.subscriptionFilters.unsubscribe();
  }
}
