import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import Map from 'ol/Map';
import { Fill, Stroke, Style } from 'ol/style';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorImageLayer from 'ol/layer/VectorImage';
import Polygon from 'ol/geom/Polygon';
import { Draw, Modify, Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import GeometryType from 'ol/geom/GeometryType';
import { createBox } from 'ol/interaction/Draw';

import { GLOBAL } from '@core/services/global';
import { OlMapService } from '@core/services/ol-map.service';
import { FilterService } from '@core/services/filter.service';
import { ReportControlService } from '@core/services/report-control.service';
import { AnomaliaService } from '@core/services/anomalia.service';

import { Anomalia } from '@core/models/anomalia';

@Injectable({
  providedIn: 'root',
})
export class AnomaliasControlService {
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  public map: Map;
  public selectedInformeId: string;
  private _anomaliaSelect: Anomalia = undefined;
  public anomaliaSelect$ = new BehaviorSubject<Anomalia>(this._anomaliaSelect);
  private _anomaliaHover: Anomalia = undefined;
  public anomaliaHover$ = new BehaviorSubject<Anomalia>(this._anomaliaHover);
  private prevFeatureHover: any;
  public prevAnomaliaSelect: Anomalia;
  public listaAnomalias: Anomalia[];
  private anomaliaLayers: VectorLayer[];
  private sharedReportNoFilters = false;

  constructor(
    private olMapService: OlMapService,
    private filterService: FilterService,
    private reportControlService: ReportControlService,
    private anomaliaService: AnomaliaService
  ) {}

  initService(): Observable<boolean> {
    const getMap = this.olMapService.getMap();
    const getAnomLayers = this.olMapService.getAnomaliaLayers();
    const getIfSharedWithFilters = this.reportControlService.sharedReportWithFilters$;

    combineLatest([getMap, getAnomLayers, getIfSharedWithFilters])
      .pipe(take(1))
      .subscribe(([map, anomL, isSharedWithFil]) => {
        this.map = map;
        this.anomaliaLayers = anomL;
        this.sharedReportNoFilters = !isSharedWithFil;

        this.initialized$.next(true);
      });

    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      this.selectedInformeId = informeId;
      this.prevAnomaliaSelect = undefined;
      this.prevFeatureHover = undefined;
      this.anomaliaSelect = undefined;
    });

    return this.initialized$;
  }

  public mostrarAnomalias() {
    this.filterService.filteredElements$.subscribe((anomalias) => {
      if (this.listaAnomalias !== undefined) {
        this.setVisibleAnoms(anomalias as Anomalia[]);
      } else {
        if (this.sharedReportNoFilters) {
          const anomFil = anomalias.filter((anom) => (anom as Anomalia).informeId === this.selectedInformeId);
          this.dibujarAnomalias(anomFil as Anomalia[]);
          this.listaAnomalias = anomalias as Anomalia[];
        } else {
          this.dibujarAnomalias(anomalias as Anomalia[]);
          this.listaAnomalias = anomalias as Anomalia[];

          // reiniciamos las anomalias seleccionadas cada vez que se aplica un filtro
          this.prevAnomaliaSelect = undefined;
          this.anomaliaSelect = undefined;
        }
      }
    });
  }

  private dibujarAnomalias(anomalias: Anomalia[]) {
    // Para cada vector layer (que corresponde a un informe)
    this.anomaliaLayers.forEach((l) => {
      // filtra las anomalías correspondientes al informe
      const filtered = anomalias.filter((item) => item.informeId === l.getProperties().informeId);
      const source = l.getSource();
      source.clear();
      filtered.forEach((anom) => {
        const feature = new Feature({
          geometry: new Polygon([anom.featureCoords]),
          properties: {
            anomaliaId: anom.id,
            tipo: anom.tipo,
            clase: anom.clase,
            temperaturaMax: anom.temperaturaMax,
            temperaturaRef: anom.temperaturaRef,
            informeId: anom.informeId,
            visible: true,
          },
        });
        source.addFeature(feature);
      });
    });

    // eliminamos la interacciones anteriores si las huviese
    this.removeSelectAnomaliaInteractions();

    // añadimos acciones sobre las anomalias
    this.addPointerOnHover();
    this.addOnHoverAction();
    this.addSelectInteraction();
    this.addClickOutFeatures();
  }

  private setVisibleAnoms(anomalias: Anomalia[]) {
    this.anomaliaLayers.forEach((layer) => {
      const source = layer.getSource();

      const features = source.getFeatures();

      features.forEach((feature) => {
        if (anomalias.map((anom) => anom.id).includes(feature.getProperties().properties.anomaliaId)) {
          if (feature.getStyle() === new Style(null)) {
            feature.setStyle(this.getStyleAnomaliasMapa(false));
          }
          // if (feature.getProperties().properties.visible === false) {
          //   feature.getProperties().properties.visible = true;
          //   feature.setStyle(this.getStyleAnomaliasMapa(false));
          // }
        } else {
          feature.setStyle(new Style(null));

          // if (feature.getProperties().properties.visible === true) {
          //   feature.getProperties().properties.visible = false;
          //   feature.setStyle(this.getStyleAnomaliasMapa(false));
          // }
        }
      });
    });
  }

  private removeSelectAnomaliaInteractions() {
    // eliminamos solo las interacciones 'select'
    this.map
      .getInteractions()
      .getArray()
      .forEach((interaction) => {
        if (interaction.getListeners('select') !== undefined) {
          if (interaction.getProperties().id === 'selectAnomalia') {
            this.map.removeInteraction(interaction);
          }
        }
      });
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        let feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        feature = feature.filter((item) => item.getProperties().properties.informeId === this.selectedInformeId);

        if (feature.length > 0) {
          // cambia el puntero por el de seleccionar
          this.map.getViewport().style.cursor = 'pointer';
        } else {
          // vuelve a poner el puntero normal
          this.map.getViewport().style.cursor = 'inherit';
        }
      } else {
        // vuelve a poner el puntero normal
        this.map.getViewport().style.cursor = 'inherit';
      }
    });
  }

  private addOnHoverAction() {
    let currentFeatureHover;
    this.map.on('pointermove', (event) => {
      if (this.anomaliaSelect === undefined) {
        if (this.map.hasFeatureAtPixel(event.pixel)) {
          const feature = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined)
            .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId);

          if (feature.length > 0) {
            // cuando pasamos de una anomalia a otra directamente sin pasar por vacio
            if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
              (this.prevFeatureHover[0] as Feature).setStyle(this.getStyleAnomaliasMapa(false));
            }
            currentFeatureHover = feature;

            const anomaliaId = feature[0].getProperties().properties.anomaliaId;
            const anomalia = this.listaAnomalias.filter((anom) => anom.id === anomaliaId)[0];

            (feature[0] as Feature).setStyle(this.getStyleAnomaliasMapa(true));

            if (this.selectedInformeId === anomalia.informeId) {
              this.anomaliaHover = anomalia;
            }
            this.prevFeatureHover = feature;
          }
        } else {
          this.anomaliaHover = undefined;

          if (currentFeatureHover !== undefined) {
            (currentFeatureHover[0] as Feature).setStyle(this.getStyleAnomaliasMapa(false));
            currentFeatureHover = undefined;
          }
        }
      }
    });
  }

  private addSelectInteraction() {
    const select = new Select({
      style: this.getStyleAnomaliasMapa(true),
      condition: click,
      layers: (l) => {
        if (l.getProperties().informeId === this.selectedInformeId) {
          return true;
        } else {
          return false;
        }
      },
    });

    select.setProperties({ id: 'selectAnomalia' });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (this.anomaliaSelect !== undefined) {
        this.setExternalStyle(this.anomaliaSelect.id, false);
        this.anomaliaSelect = undefined;
      }

      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const anomaliaId = e.selected[0].getProperties().properties.anomaliaId;
          const anomalia = this.listaAnomalias.filter((anom) => anom.id === anomaliaId)[0];

          if (this.prevAnomaliaSelect !== undefined) {
            this.setExternalStyle(this.prevAnomaliaSelect.id, false);
          }
          this.prevAnomaliaSelect = anomalia;
          this.anomaliaSelect = anomalia;
          this.setExternalStyle(anomalia.id, true);
          this.anomaliaHover = undefined;
        }
      }
    });

    // hacemos el poligono editable
    // this.canModifyPolygon(select);
  }

  private addClickOutFeatures() {
    this.map.on('click', (event) => {
      const feature = this.map
        .getFeaturesAtPixel(event.pixel)
        .filter((item) => item.getProperties().properties !== undefined)
        .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId);
      if (feature.length === 0) {
        if (this.anomaliaSelect !== undefined) {
          this.setExternalStyle(this.anomaliaSelect.id, false);
        }
        this.anomaliaSelect = undefined;
      }
    });
  }

  private canModifyPolygon(select: Select) {
    const modify = new Modify({
      features: select.getFeatures(),
    });
    this.map.addInteraction(modify);

    modify.on('modifyend', (e) => {
      const newCoords = (e.features.getArray()[0].getGeometry() as Polygon).getCoordinates()[0];
      this.anomaliaSelect.featureCoords = newCoords;
      // actualizamos el poligono en la DB con las nuevas coordenadas
      this.anomaliaService.updateAnomalia(this.anomaliaSelect);
    });
  }

  public permitirCrearAnomalias(plantaId: string) {
    const draw = new Draw({
      source: this.anomaliaLayers[0].getSource(),
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
    });

    this.map.addInteraction(draw);
    draw.on('drawend', (event) => {
      this.addAnomaliaToDb(event.feature, plantaId);
    });
  }

  private addAnomaliaToDb(feature: Feature, plantaId: string) {
    const geometry = feature.getGeometry() as SimpleGeometry;

    const anomalia = new Anomalia(
      0,
      ['', '', ''],
      0,
      0,
      0,
      0,
      null,
      0,
      geometry.getCoordinates()[0],
      geometry.getType(),
      plantaId,
      this.selectedInformeId
    );
    // Guardar en la base de datos
    this.anomaliaService.addAnomalia(anomalia);
  }

  get anomaliaSelect() {
    return this._anomaliaSelect;
  }

  set anomaliaSelect(value: Anomalia) {
    this._anomaliaSelect = value;
    this.anomaliaSelect$.next(value);
  }

  get anomaliaHover() {
    return this._anomaliaHover;
  }

  set anomaliaHover(value: Anomalia) {
    this._anomaliaHover = value;
    this.anomaliaHover$.next(value);
  }

  public getStyleAnomaliasMapa(selected = false) {
    return (feature) => {
      if (
        feature !== undefined &&
        feature.getProperties().hasOwnProperty('properties') &&
        feature.getProperties().properties.visible === true
      ) {
        if (selected) {
          return new Style({
            stroke: new Stroke({
              color: 'white',
              width: 8,
            }),
            fill: new Fill({
              color: 'rgba(0, 0, 255, 0)',
            }),
          });
        }
        return new Style({
          stroke: new Stroke({
            color: this.getColorAnomalia(feature),
            width: 4,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0)',
          }),
        });
      }
    };
  }

  private getColorAnomalia(feature: Feature) {
    if (feature !== undefined) {
      const tipo = parseInt(feature.getProperties().properties.tipo);

      return GLOBAL.colores_tipos[tipo];
    }
  }

  setExternalStyle(anomaliaId: string, focus: boolean) {
    this.listaAnomalias.find((anomalia) => anomalia.id === anomaliaId);

    const features = this.anomaliaLayers
      .find((layer) => layer.getProperties().informeId === this.selectedInformeId)
      .getSource()
      .getFeatures();

    const feature = features.find((f) => f.getProperties().properties.anomaliaId === anomaliaId);

    const focusedStyle = new Style({
      stroke: new Stroke({
        color: 'white',
        width: 8,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0)',
      }),
    });

    const unfocusedStyle = new Style({
      stroke: new Stroke({
        color: this.getColorAnomalia(feature),
        width: 4,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0)',
      }),
    });

    if (focus) {
      feature.setStyle(focusedStyle);
    } else {
      feature.setStyle(unfocusedStyle);
    }
  }
}
