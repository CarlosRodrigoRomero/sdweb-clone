import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { AngularFireStorage } from '@angular/fire/storage';

import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import Map from 'ol/Map';
import { TileCoord } from 'ol/tilecoord';
import { Coordinate } from 'ol/coordinate';
import TileLayer from 'ol/layer/Tile';
import { LocationAreaInterface } from '@core/models/location';

import pdfMake from 'pdfmake/build/pdfmake.js';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

import { fabric } from 'fabric';

import { ReportControlService } from '@data/services/report-control.service';
import { DownloadReportService } from '@data/services/download-report.service';
import { GLOBAL } from '@data/constants/global';
import { AnomaliaService } from '@data/services/anomalia.service';
import { PlantaService } from '@data/services/planta.service';
import { FilterService } from '@data/services/filter.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ImageProcessService } from '../../services/image-process.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { ImagesLoadService } from '../../services/images-load.service';
import { ImagesTilesService } from '../../services/images-tiles.service';
import { ReportPdfService } from '@data/services/report-pdf.service';

import { DialogFilteredReportComponent } from '../dialog-filtered-report/dialog-filtered-report.component';
import { Translation } from '@shared/utils/translations/translations';
import { MatDialogConfirmComponent } from '@shared/components/mat-dialog-confirm/mat-dialog-confirm.component';
import { AnomsTable } from './pdf-structure';

import { Seguidor } from '@core/models/seguidor';
import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';
import { PcInterface } from '@core/models/pc';

import { DRONE } from '@data/constants/drone';

@Component({
  selector: 'app-download-pdf',
  templateUrl: './download-pdf.component.html',
  styleUrls: ['./download-pdf.component.css'],
  providers: [DecimalPipe, DatePipe],
})
export class DownloadPdfComponent implements OnInit, OnDestroy {
  private _countLoadedImages = 0;
  countLoadedImages$ = new BehaviorSubject<number>(this._countLoadedImages);
  private _countLoadedImagesSegs1EjeAnoms = 0;
  countLoadedImagesSegs1EjeAnoms$ = new BehaviorSubject<number>(this._countLoadedImagesSegs1EjeAnoms);
  private _countLoadedImagesSegs1EjeNoAnoms = 0;
  countLoadedImagesSegs1EjeNoAnoms$ = new BehaviorSubject<number>(this._countLoadedImagesSegs1EjeNoAnoms);
  private _loadedImages = undefined;
  loadedImages$ = new BehaviorSubject<string>(this._loadedImages);
  private countAnomalias: number;
  private countSegs1EjeAnoms: number;
  private countSegs1EjeNoAnoms: number;
  private countSeguidores: number;
  private _seguidoresInforme: Seguidor[] = [];
  seguidoresInforme$ = new BehaviorSubject<Seguidor[]>(this._seguidoresInforme);
  private anomaliasInforme: Anomalia[] = []; // equivalente allAnomalias en fijas
  private planta: PlantaInterface;
  private selectedInforme: InformeInterface;
  private translation: Translation;
  private language: string; // antes lan
  private _columnasAnomalia: any[] = []; // antes pcColumnas
  columnasAnomalia$ = new BehaviorSubject<any[]>(this._columnasAnomalia); // equvalente a currentFilteredColumnas$
  private filtroColumnas: string[];
  private layerInformeSelected: TileLayer;
  private alturaMax = 0;

  // IMAGENES
  private imgLogoBase64: string;
  private imgPortadaBase64: string;
  private imgIrradianciaBase64: string;
  private imgSuciedadBase64: string;
  private imgFormulaMaeBase64: string;
  private imgCurvaMaeBase64: string;
  private imgLogoFooterBase64: string;

  private widthPlano: number;
  private widthLogoOriginal: number;
  private imageListBase64 = {};
  private tileResolution = 256;
  private imgSolardroneBase64: string;
  private imagesPlantaCompleta = {};

  private countCategoria;
  private countPosicion;
  private countCategoriaClase;
  private countClase;
  private informeCalculado: boolean;
  private arrayFilas: Array<number>;
  private arrayColumnas: Array<number>;
  private irradianciaMedia: number;
  private tempReflejada: number;
  private emisividad: number;
  private numTipos: number[];
  private numClases: number[];
  private anomTipos = GLOBAL.labels_tipos; // antes pcDescripcion
  private dataSource: MatTableDataSource<AnomsTable>;
  private filtroApartados: string[];
  private currentFiltroGradiente: number;
  private labelsCriticidad: string[];
  private widthImageSeguidor: number;
  private widthImageAnomalia: number;
  private hasUserArea: boolean;
  seguidoresLoaded = false;
  private map: Map;
  private seguidores1ejeAnoms: LocationAreaInterface[] = [];
  private anomSeguidores1Eje: Anomalia[][] = [];
  private seguidores1ejeNoAnoms: LocationAreaInterface[] = [];
  private largestLocAreas: LocationAreaInterface[] = [];
  simplePDF = false;
  private maxAnomsConImgs = 500;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
    private reportControlService: ReportControlService,
    private downloadReportService: DownloadReportService,
    private storage: AngularFireStorage,
    private plantaService: PlantaService,
    private anomaliaService: AnomaliaService,
    public dialog: MatDialog,
    private filterService: FilterService,
    private olMapService: OlMapService,
    private imageProcessService: ImageProcessService,
    private anomaliaInfoService: AnomaliaInfoService,
    private imagesLoadService: ImagesLoadService,
    private imagesTilesService: ImagesTilesService,
    private reportPdfService: ReportPdfService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.downloadReportService.englishLang$.subscribe((lang) => {
        if (lang) {
          this.language = 'en';
        } else {
          this.language = 'es';
        }
      })
    );

    // comprobamos el numero de anomalias para imprimir o no imagenes
    // this.subscriptions.add(
    //   combineLatest([
    //     this.reportControlService.selectedInformeId$,
    //     this.reportControlService.allFilterableElements$,
    //   ]).subscribe(([informeId, elems]) => {

    //     if (elems.length <= this.maxAnomsConImgs && elems.length > 0) {
    //       this.reportPdfService.informeConImagenes = true;
    //     } else {
    //       this.reportPdfService.informeConImagenes = false;
    //     }
    //   })
    // );

    this.subscriptions.add(
      this.imagesTilesService.layerInformeSelected$.subscribe((layer) => (this.layerInformeSelected = layer))
    );

    this.numTipos = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);
    this.numClases = Array(GLOBAL.labels_clase.length)
      .fill(0)
      .map((_, i) => i + 1);

    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));

    this.subscriptions.add(this.downloadReportService.simplePDF$.subscribe((value) => (this.simplePDF = value)));

    // suscripciones a las imagenes
    this.loadOtherImages();

    this.subscriptions.add(
      this.plantaService
        .getPlanta(this.reportControlService.plantaId)
        .pipe(
          take(1),
          switchMap((planta) => {
            this.planta = planta;

            // if (this.planta.tipo === '1 eje') {
            //   this.downloadReportService.getSeguidores1Eje(this.planta.id);
            // }

            this.plantaService.planta = planta;

            this.columnasAnomalia = GLOBAL.columnasAnomPdf;

            this.filtroColumnas = this.columnasAnomalia.map((element) => element.nombre);

            // cargamos las imagenes que no cambian al cambiar de informe
            this.imagesLoadService.loadFixedImages(this.planta.empresa);

            return this.plantaService.getLocationsArea(this.planta.id);
          }),
          take(1),
          switchMap((locAreas) => {
            this.largestLocAreas = locAreas.filter(
              (locArea) =>
                locArea.globalCoords[0] !== undefined &&
                locArea.globalCoords[0] !== null &&
                locArea.globalCoords[0] !== ''
            );

            return combineLatest([
              this.reportControlService.selectedInformeId$,
              this.downloadReportService.filteredPDF$,
            ]);
          }),
          switchMap(([informeId, filteredPDF]) => {
            this.selectedInforme = this.reportControlService.informes.find((informe) => informeId === informe.id);

            if (this.reportControlService.plantaFija) {
              this.anomaliasInforme = this.reportControlService.allFilterableElements.filter(
                (elem) => elem.informeId === informeId
              ) as Anomalia[];
            } else {
              const allSeguidores = this.reportControlService.allFilterableElements.filter(
                (elem) => elem.informeId === informeId
              ) as Seguidor[];
              // filtramos los del informe actual y los ordenamos por globals
              this.seguidoresInforme = allSeguidores
                .filter((seg) => seg.informeId === informeId)
                .sort(this.downloadReportService.sortByGlobalCoords);

              if (this.seguidoresInforme.length > 0) {
                this.seguidoresLoaded = true;
              }

              this.anomaliasInforme = [];

              this.seguidoresInforme.forEach((seguidor) => {
                const anomaliasSeguidor = seguidor.anomaliasCliente;
                if (anomaliasSeguidor.length > 0) {
                  this.anomaliasInforme.push(...anomaliasSeguidor);
                }
              });
              for (let index = 0; index < this.anomaliasInforme.length; index++) {
                const anoms = this.anomaliasInforme.filter((anom) => anom.numAnom === index + 1);
                if (anoms.length > 1) {
                  console.log(anoms.map((anom) => anom.globalCoords));
                }
              }

              // ordenamos la lista de anomalias por tipo
              this.anomaliasInforme = this.anomaliasInforme.sort((a, b) => a.numAnom - b.numAnom);
            }

            // comprobamos el numero de anomalias para imprimir o no imagenes
            if (this.anomaliasInforme.length <= this.maxAnomsConImgs && this.anomaliasInforme.length > 0) {
              this.reportPdfService.informeConImagenes = true;
            } else {
              this.reportPdfService.informeConImagenes = false;
            }

            return this.downloadReportService.seguidores1Eje$;
          })
        )
        .subscribe((segs) => {
          segs.forEach((seg) => {
            const anomsSeguidor = this.anomaliasInforme.filter(
              (anom) => anom.globalCoords.toString() === seg.globalCoords.toString()
            );
            if (anomsSeguidor.length > 0) {
              this.anomSeguidores1Eje.push(anomsSeguidor);
              this.seguidores1ejeAnoms.push(seg);
            } else {
              this.seguidores1ejeNoAnoms.push(seg);
            }
          });

          // obtenemos la altura maxima de los modulos
          this.alturaMax = this.getAlturaMax();

          this.arrayFilas = Array(this.alturaMax)
            .fill(0)
            .map((_, i) => i + 1);
          this.arrayColumnas = Array(this.planta.columnas)
            .fill(0)
            .map((_, i) => i + 1);

          // este es el gradiente mínima bajo el que se filtra por criterio de criticidad
          this.currentFiltroGradiente = this.anomaliaService.criterioCriticidad.rangosDT[0];

          // asignamos los labels del criterio especifico del cliente
          this.labelsCriticidad = this.anomaliaService.criterioCriticidad.labels;
        })
    );

    this.widthPlano = 500;

    this.widthImageSeguidor = 450;
    this.widthImageAnomalia = 300;
    this.hasUserArea = false;

    this.subscriptions.add(
      this.plantaService.getUserAreas$(this.reportControlService.plantaId).subscribe((userAreas) => {
        if (userAreas.length > 0) {
          this.hasUserArea = true;
        }
      })
    );
  }

  private loadOtherImages() {
    this.subscriptions.add(
      this.imagesLoadService.imgIrradianciaBase64$.subscribe((img) => (this.imgIrradianciaBase64 = img))
    );

    this.subscriptions.add(
      this.imagesLoadService.imgSuciedadBase64$.subscribe((img) => (this.imgSuciedadBase64 = img))
    );

    this.subscriptions.add(this.imagesLoadService.imgPortadaBase64$.subscribe((img) => (this.imgPortadaBase64 = img)));

    this.subscriptions.add(this.imagesLoadService.imgLogoBase64$.subscribe((img) => (this.imgLogoBase64 = img)));

    this.subscriptions.add(
      this.imagesLoadService.imgSolardroneBase64$.subscribe((img) => (this.imgSolardroneBase64 = img))
    );

    this.subscriptions.add(
      this.imagesLoadService.imgFormulaMaeBase64$.subscribe((img) => (this.imgFormulaMaeBase64 = img))
    );

    this.subscriptions.add(
      this.imagesLoadService.imgCurvaMaeBase64$.subscribe((img) => (this.imgCurvaMaeBase64 = img))
    );

    this.subscriptions.add(
      this.imagesLoadService.imgLogoFooterBase64$.subscribe((img) => (this.imgLogoFooterBase64 = img))
    );

    this.subscriptions.add(
      this.imagesTilesService.imagesPlantaCompleta$.subscribe((imgs) => (this.imagesPlantaCompleta = imgs))
    );
  }

  private getAlturaMax() {
    return Math.max(
      ...[...this.anomaliasInforme.map((anom) => Number(anom.localY)).filter((fila) => !isNaN(fila)), this.planta.filas]
    );
  }

  public selectFilteredPDF() {
    const dialogRef = this.dialog.open(DialogFilteredReportComponent);

    dialogRef.afterClosed().subscribe(() => (this.downloadReportService.filteredPDF = undefined));
  }

  setSimplePDF(checked: boolean) {
    this.downloadReportService.simplePDF = checked;
  }

  private getImgsPlanos() {
    if (this.selectedInforme.fecha > GLOBAL.newReportsDate) {
      // imágenes planta completa
      if (this.planta.tipo !== 'seguidores') {
        this.imagesTilesService.setImgPlanoPlanta(
          this.largestLocAreas,
          'thermal',
          this.selectedInforme.id,
          this.anomaliasInforme
        );
      }
      this.imagesTilesService.setImgPlanoPlanta(this.largestLocAreas, 'visual', this.selectedInforme.id);
    }
  }

  selectDownloadType() {
    if (this.reportControlService.plantaFija) {
      if (this.reportPdfService.informeConImagenes) {
        this.selectDownloadAnomImages();
      } else {
        this.downloadPDF();
      }
    } else {
      this.downloadPDF();
    }
  }

  private selectDownloadAnomImages() {
    const dialogRef = this.dialog.open(MatDialogConfirmComponent, {
      data: '¿Quiere incluir imágenes de las anomalías?',
    });

    dialogRef.afterClosed().subscribe((response: boolean) => {
      this.reportPdfService.incluirImagenes = response;

      this.downloadPDF();
    });
  }

  selectProgressBarMode() {
    if (this.reportControlService.plantaFija) {
      if (this.reportPdfService.informeConImagenes && this.reportPdfService.incluirImagenes) {
        this.downloadReportService.progressBarMode = 'determinate';
      } else {
        this.downloadReportService.progressBarMode = 'indeterminate';
      }
    } else {
      this.downloadReportService.progressBarMode = 'determinate';
    }
  }

  private getPrefijoInforme() {
    let prefijo = this.selectedInforme.prefijo;

    const parteFinal = this.translation.t('informe');

    if (prefijo !== undefined) {
      prefijo = prefijo + '_' + parteFinal;
    } else {
      prefijo = parteFinal;
    }
    return prefijo;
  }

  private downloadPDF() {
    // cargamos los apartados del informe
    this.reportPdfService.loadApartadosInforme(this.planta, this.selectedInforme);

    this.filtroApartados = this.reportPdfService.apartadosInforme.map((element) => element.nombre);

    // seleccionamos el modo de progressBar
    this.selectProgressBarMode();

    this.downloadReportService.endingDownload = false;
    this.downloadReportService.generatingDownload = true;
    this.downloadReportService.typeDownload = 'pdf';

    // cargamos imagenes que cambian con cada informe
    this.imagesLoadService.loadChangingImages(this.selectedInforme.id);

    if (this.reportControlService.thereAreZones) {
      // reseteamos el contador de planos cargados en cada descarga
      this.imagesTilesService.imagesPlantaLoaded = 0;
      // cargamos las orto termica y visual de la planta
      this.getImgsPlanos();
    }

    this.countLoadedImages = 0;
    this.countLoadedImagesSegs1EjeAnoms = 0;
    this.countLoadedImagesSegs1EjeNoAnoms = 0;

    // PLANTAS FIJAS
    if (this.reportControlService.plantaFija) {
      if (this.reportPdfService.informeConImagenes && this.reportPdfService.incluirImagenes) {
        // Imagenes anomalías
        this.countAnomalias = 0;
        this.anomaliasInforme.forEach((anomalia, index) => {
          // if (index < 700) {
          this.setImgAnomaliaCanvas(anomalia);
          this.countAnomalias++;
          // }
        });

        // if (this.planta.tipo === '1 eje') {
        //   // Imagenes S1E con anomalías
        //   this.seguidores1ejeAnoms.forEach((seg, index) => {
        //     // if (index < 2) {
        //       this.setImgSeguidor1EjeCanvas(seg, index, this.anomSeguidores1Eje[index]);
        //     // }
        //   });

        //   // Imagenes S1E sin anomalías
        //   this.seguidores1ejeNoAnoms.forEach((seg, index) => {
        //     // if (index < 2 ) {
        //     this.setImgSeguidor1EjeCanvas(seg, index);
        //     // }
        //   });

        // con este contador impedimos que se descarge más de una vez debido a la suscripcion a las imagenes
        let downloads = 0;

        const subscription = combineLatest([
          this.countLoadedImages$,
          this.countLoadedImagesSegs1EjeAnoms$,
          this.countLoadedImagesSegs1EjeNoAnoms$,
        ]).subscribe(([countLoadedImgs, countLoadedImgSegs1EjeAnoms, countLoadedImgSegs1EjeNoAnoms]) => {
          this.downloadReportService.progressBarValue = Math.round(
            ((countLoadedImgs + countLoadedImgSegs1EjeAnoms + countLoadedImgSegs1EjeNoAnoms) /
              (this.anomaliasInforme.length + this.seguidores1ejeAnoms.length + this.seguidores1ejeNoAnoms.length)) *
              100
          );

          // comprobamos que estan cargados los planos de la planta
          this.imagesTilesService.checkImgsPlanosLoaded().then((planosLoaded) => {
            // comprobamos que estan cargadas tb el resto de imagenes del PDF
            this.imagesLoadService.checkImagesLoaded().then((imagesLoaded) => {
              // Cuando se carguen todas las imágenes
              if (
                imagesLoaded &&
                countLoadedImgs + countLoadedImgSegs1EjeAnoms + countLoadedImgSegs1EjeNoAnoms ===
                  this.countAnomalias + this.seguidores1ejeAnoms.length + this.seguidores1ejeNoAnoms.length &&
                downloads === 0
              ) {
                this.calcularInforme();

                pdfMake
                  .createPdf(this.getDocDefinition(this.imageListBase64))
                  .download(this.getPrefijoInforme(), () => {
                    this.downloadReportService.progressBarValue = 0;

                    this.downloadReportService.generatingDownload = false;

                    subscription.unsubscribe();
                  });
                this.downloadReportService.endingDownload = true;

                downloads++;
              }
            });
          });
        });
      } else {
        // con este contador impedimos que se descarge más de una vez debido a la suscripcion a las imagenes
        let downloads = 0;

        const subscription = this.countLoadedImages$.subscribe((countLoadedImgs) => {
          this.downloadReportService.progressBarValue = Math.round(
            (countLoadedImgs / this.anomaliasInforme.length) * 100
          );

          // comprobamos que estan cargados los planos de la planta
          this.imagesTilesService.checkImgsPlanosLoaded().then((planosLoaded) => {
            // comprobamos que estan cargadas tb el resto de imagenes del PDF
            this.imagesLoadService.checkImagesLoaded().then((imagesLoaded) => {
              // comprobamos si se van a cargar imagenes de anomalias
              if (this.reportPdfService.informeConImagenes && this.reportPdfService.incluirImagenes) {
                // Cuando se carguen todas las imágenes
                if (planosLoaded && imagesLoaded && countLoadedImgs === this.countAnomalias && downloads === 0) {
                  this.calcularInforme();

                  pdfMake
                    .createPdf(this.getDocDefinition(this.imageListBase64))
                    .download(this.getPrefijoInforme(), () => {
                      this.downloadReportService.progressBarValue = 0;

                      this.downloadReportService.generatingDownload = false;

                      subscription.unsubscribe();
                    });
                  this.downloadReportService.endingDownload = true;

                  downloads++;
                }
              } else {
                // Cuando se carguen todas las imágenes
                if (planosLoaded && imagesLoaded && downloads === 0) {
                  this.calcularInforme();

                  pdfMake.createPdf(this.getDocDefinition()).download(this.getPrefijoInforme(), () => {
                    this.downloadReportService.progressBarValue = 0;

                    this.downloadReportService.generatingDownload = false;

                    subscription.unsubscribe();
                  });
                  this.downloadReportService.endingDownload = true;

                  downloads++;
                }
              }
            });
          });
        });
      }
    } else {
      // PLANTAS SEGUIDORES
      // Generar imagenes
      this.countSeguidores = 0;
      this.seguidoresInforme.forEach((seguidor, index) => {
        this.setImgSeguidorCanvas(seguidor, false, 'jpg');
        this.countSeguidores++;
      });

      // con este contador impedimos que se descarge más de una vez debido a la suscripcion a las imagenes
      let downloads = 0;

      const subscription = this.countLoadedImages$.subscribe((countLoadedImgs) => {
        this.downloadReportService.progressBarValue = Math.round(
          (countLoadedImgs / this.seguidoresInforme.length) * 100
        );

        // comprobamos que estan cargadas tb el resto de imagenes del PDF
        this.imagesLoadService.checkImagesLoaded().then((imagesLoaded) => {
          // Cuando se carguen todas las imágenes
          if (imagesLoaded && countLoadedImgs === this.countSeguidores && downloads === 0) {
            this.calcularInforme();

            pdfMake.createPdf(this.getDocDefinition(this.imageListBase64)).download(this.getPrefijoInforme(), () => {
              this.downloadReportService.progressBarValue = 0;

              this.downloadReportService.generatingDownload = false;

              subscription.unsubscribe();
            });
            this.downloadReportService.endingDownload = true;

            downloads++;
          }
        });
      });
    }
  }

  private calcularInforme() {
    this.translation = new Translation(this.language);
    this.countCategoria = Array();
    this.countCategoriaClase = Array();
    this.countClase = Array();
    this.countPosicion = Array();

    this.informeCalculado = false;

    const irradiancias: number[] = this.anomaliasInforme.map((anom) => anom.irradiancia);

    this.irradianciaMedia = irradiancias.sort((a, b) => a - b)[Math.round(irradiancias.length / 2)];

    if (isNaN(this.irradianciaMedia)) {
      this.irradianciaMedia = 800;
    }

    this.emisividad = this.selectedInforme.emisividad;
    this.tempReflejada = this.selectedInforme.tempReflejada;

    // Calcular las alturas
    for (const y of this.arrayFilas) {
      const countColumnas: number[] = [];
      for (const x of this.arrayColumnas) {
        // tslint:disable-next-line: triple-equals
        countColumnas.push(this.anomaliasInforme.filter((anom) => anom.localX == x && anom.localY == y).length);
      }
      this.countPosicion.push(countColumnas);
    }

    // CATEGORIAS //
    for (const tipo of this.numTipos) {
      // tslint:disable-next-line: triple-equals
      const anomsTipo = this.anomaliasInforme.filter((anom) => anom.tipo == tipo);

      this.countCategoria.push(anomsTipo.length);

      const count1 = Array();
      for (const clas of this.numClases) {
        // tslint:disable-next-line: triple-equals
        const anomsClase = this.anomaliasInforme.filter((anom) => anom.clase == clas);

        count1.push(anomsClase.length);
      }
      const totalAnomsInFilter = count1[0] + count1[1] + count1[2];
      if (totalAnomsInFilter > 0) {
        this.countCategoriaClase.push({
          categoria: this.anomTipos[tipo],
          coa1: count1[0],
          coa2: count1[1],
          coa3: count1[2],
          total: totalAnomsInFilter,
        });
      }
    }

    // CLASES //
    let filtroClase;
    for (const j of this.numClases) {
      filtroClase = this.anomaliasInforme.filter((anom) => anom.clase === j);

      this.countClase.push(filtroClase.length);
    }

    this.informeCalculado = true;
    this.dataSource = new MatTableDataSource(this.countCategoriaClase);
  }

  getDocDefinition(images?: any): TDocumentDefinitions {
    const pages = this.getPagesPDF();
    let anexo1 = [];
    let anexoAnomalias = [];
    let anexoSeguidores1EjeAnoms = [];
    let anexoSeguidores1EjeNoAnoms = [];
    let anexoSeguidores = [];
    let anexoSegsNoAnoms = [];

    let numAnexo = 'I';

    if (this.filtroApartados.includes('anexo1')) {
      anexo1 = this.getAnexoLista(numAnexo);
      numAnexo = 'II';
    }
    if (this.filtroApartados.includes('anexoAnomalias')) {
      anexoAnomalias = this.getAnexoAnomalias(numAnexo);
      numAnexo = 'III';
    }
    // if (this.filtroApartados.includes('anexoSeguidores1EjeAnoms')) {
    //   anexoSeguidores1EjeAnoms = this.getAnexoSegs1EjeAnoms(numAnexo);
    //   numAnexo = 'IV';
    // }
    // if (this.filtroApartados.includes('anexoSeguidores1EjeNoAnoms')) {
    //   anexoSeguidores1EjeNoAnoms = this.getAnexoSegs1EjeNoAnoms(numAnexo);
    // }
    if (this.filtroApartados.includes('anexoSeguidores')) {
      anexoSeguidores = this.getAnexoSeguidores(numAnexo);
      numAnexo = 'III';
    }
    if (this.filtroApartados.includes('anexoSegsNoAnoms')) {
      anexoSegsNoAnoms = this.getAnexoSeguidoresSinAnomalias(numAnexo);
    }

    return {
      header: (currentPage, pageCount) => {
        if (currentPage > 1) {
          return [
            {
              margin: [0, 10, 0, 0],
              image: this.imgLogoBase64,
              width: this.imagesLoadService.scaleImgLogoHeader * this.imagesLoadService.widthLogoEmpresa,
              alignment: 'center',
            },
          ];
        }
      },

      content: pages
        .concat(anexo1)
        .concat(anexoAnomalias)
        .concat(anexoSeguidores1EjeAnoms)
        .concat(anexoSeguidores1EjeNoAnoms)
        .concat(anexoSeguidores)
        .concat(anexoSegsNoAnoms),

      images,

      footer: (currentPage, pageCount) => {
        if (currentPage > 1) {
          return {
            table: {
              widths: [300, '*'],
              body: [
                [
                  {
                    text: currentPage,
                    alignment: 'right',
                    color: 'grey',
                    margin: [0, 0, 0, 0],
                  },
                  {
                    image: this.imgLogoFooterBase64,
                    width: this.imagesLoadService.widthImgLogoFooter,
                    alignment: 'right',
                    margin: [0, -10, 15, 0],
                  },
                ],
              ],
            },
            layout: 'noBorders',
          };
        }
      },

      pageMargins: [40, 60, 40, 40],

      styles: {
        h1: {
          fontSize: 22,
          bold: true,
        },
        h2: {
          fontSize: 18,
          bold: true,
        },
        h3: {
          fontSize: 15,
          bold: true,
        },
        h4: {
          fontSize: 13,
          bold: true,
        },
        h5: {
          fontSize: 13,
          bold: false,
          decoration: 'underline',
          margin: [30, 0, 30, 0],
        },
        p: {
          alignment: 'justify',
          margin: [30, 0, 30, 0],
        },
        tableHeaderBlue: {
          alignment: 'center',
          bold: true,
          fontSize: 10,
          fillColor: '#003b73',
          color: 'white',
        },

        tableHeaderImageData: {
          alignment: 'center',
          bold: true,
          fontSize: 10,
          fillColor: '#4cb6c9',
        },

        tableCellAnexo1: {
          alignment: 'center',
          fontSize: 9,
        },

        linkCellAnexo1: {
          alignment: 'center',
          fontSize: 9,
          decoration: 'underline',
          color: '#0645AD',
        },

        tableHeader: {
          alignment: 'center',
          bold: true,
          fontSize: 13,
        },

        pieFoto: {
          alignment: 'center',
          fontSize: 11,
          italics: true,
          color: 'gray',
        },
        subtitulo: {
          alignment: 'right',
          fontSize: 15,
        },

        table: {
          alignment: 'center',
          // margin: [0, 10, 0, 0],
        },

        param: {
          alignment: 'center',
          bold: true,
          decoration: 'underline',
        },
        tableCell: {
          alignment: 'center',
        },
        mae1: {
          fillColor: '#559c55',
          alignment: 'center',
        },
        bold: {
          bold: true,
        },
        mae2: {
          fillColor: '#00a0ea',
          alignment: 'center',
        },
        mae3: {
          fillColor: '#fdc400',
          alignment: 'center',
        },
        coa1: {
          color: 'black',
        },
        coa2: {
          color: 'orange',
        },
        coa3: {
          color: 'red',
        },
        tableLeft: {
          bold: true,
          alignment: 'right',
        },
        anomInfoTitle: {
          bold: true,
          alignment: 'left',
          fontSize: 13,
          lineHeight: 1.5,
        },
        anomInfoValue: {
          alignment: 'justify',
          fontSize: 13,
          lineHeight: 1.15,
        },
        linkAnomInfo: {
          alignment: 'left',
          fontSize: 13,
          lineHeight: 1.15,
          decoration: 'underline',
          color: '#0645AD',
        },
      },
    };
  }

  private setImgAnomaliaCanvas(anomalia: Anomalia) {
    let zoomLevel = 22;
    // parche para la planta Logrosan que tiene huecos en la capa termica
    if (this.planta.id === 'AyKgsY6F3TqGQGYNaOUY') {
      zoomLevel = 20;
    }
    const tileCoords = this.imagesTilesService.getElemTiles(
      anomalia.featureCoords,
      this.imagesTilesService.getElemExtent(anomalia.featureCoords),
      zoomLevel
    );

    const canvas = new fabric.Canvas('canvas');
    const lado = Math.sqrt(tileCoords.length);
    canvas.width = lado * this.tileResolution;
    canvas.height = lado * this.tileResolution;
    const width = canvas.width / lado;
    const height = canvas.height / lado;
    let contador = 0;
    tileCoords.forEach((tileCoord, index) => {
      const url = GLOBAL.GIS + `${this.selectedInforme.id}_thermal/${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}.png`;

      const left = (index % lado) * width;
      const top = Math.trunc(index / lado) * height;

      fabric.util.loadImage(
        url,
        (img) => {
          if (img !== null) {
            const processImg = this.imageProcessService.transformPixels(img);

            const image = new fabric.Image(processImg, {
              width,
              height,
              left,
              top,
              angle: 0,
              opacity: 1,
              draggable: false,
              lockMovementX: true,
              lockMovementY: true,
              scaleX: 1,
              scaleY: 1,
            });

            canvas.add(image);

            contador++;
            if (contador === tileCoords.length) {
              const tileGrid = this.layerInformeSelected.getSource().getTileGrid();
              const longLatOrigen = this.imagesTilesService.getLongLatFromXYZ(tileCoords[0], tileGrid);
              const longLatFin = this.imagesTilesService.getLongLatFromXYZ(tileCoords[tileCoords.length - 1], tileGrid);
              const coordsPolygonCanvas = this.getCoordsRectangleCanvas(
                longLatOrigen,
                longLatFin,
                anomalia.featureCoords,
                lado
              );
              this.imagesTilesService.drawPolygonInCanvas(anomalia.id, canvas, coordsPolygonCanvas);
              this.imagesTilesService.canvasCenterAndZoom(coordsPolygonCanvas, canvas);
              this.imageListBase64[`imgCanvas${anomalia.id}`] = canvas.toDataURL({
                format: 'png',
              });

              this.countLoadedImages++;
            }
          } else {
            contador++;
            if (contador === tileCoords.length) {
              const tileGrid = this.layerInformeSelected.getSource().getTileGrid();
              const longLatOrigen = this.imagesTilesService.getLongLatFromXYZ(tileCoords[0], tileGrid);
              const longLatFin = this.imagesTilesService.getLongLatFromXYZ(tileCoords[tileCoords.length - 1], tileGrid);
              const coordsPolygonCanvas = this.getCoordsRectangleCanvas(
                longLatOrigen,
                longLatFin,
                anomalia.featureCoords,
                lado
              );
              this.imagesTilesService.drawPolygonInCanvas(anomalia.id, canvas, coordsPolygonCanvas);
              this.imagesTilesService.canvasCenterAndZoom(coordsPolygonCanvas, canvas);
              this.imageListBase64[`imgCanvas${anomalia.id}`] = canvas.toDataURL({
                format: 'png',
              });

              this.countLoadedImages++;
            }
          }
        },
        null,
        { crossOrigin: 'anonymous' }
      );
    });
  }

  private getCoordsRectangleCanvas(
    coordsTileOrigen: number[][],
    coordsTileFin: number[][],
    polygonCoords: Coordinate[],
    lado: number
  ) {
    const topLeft = coordsTileOrigen[1];
    const bottomRight = coordsTileFin[3];
    // TODO: no ordena bien las coordenadas
    const horizOrdered = polygonCoords.sort((a, b) => a[0] - b[0]);

    let polygonTopLeft = horizOrdered[0];
    if (polygonTopLeft[1] < horizOrdered[1][1]) {
      polygonTopLeft = horizOrdered[1];
    }
    let polygonBottomRight = horizOrdered[2];
    if (polygonBottomRight[1] > horizOrdered[3][1]) {
      polygonBottomRight = horizOrdered[3];
    }
    const polygonLeft =
      ((polygonTopLeft[0] - topLeft[0]) * (this.tileResolution * lado)) / (bottomRight[0] - topLeft[0]);
    const polygonRight =
      ((polygonBottomRight[0] - topLeft[0]) * (this.tileResolution * lado)) / (bottomRight[0] - topLeft[0]);
    const polygonTop =
      (Math.abs(polygonTopLeft[1] - topLeft[1]) * (this.tileResolution * lado)) / Math.abs(bottomRight[1] - topLeft[1]);
    const polygonBottom =
      ((polygonBottomRight[1] - topLeft[1]) * (this.tileResolution * lado)) / (bottomRight[1] - topLeft[1]);
    const width = Math.abs(polygonRight - polygonLeft);
    const height = Math.abs(polygonBottom - polygonTop);

    return [polygonLeft, polygonTop, width, height];
  }

  private setImgSeguidor1EjeCanvas(seg: LocationAreaInterface, count: number, anomalias?: Anomalia[]) {
    const segCoords = this.imagesTilesService.pathToCoordinate(seg.path);
    const tileCoords = this.imagesTilesService.getElemTiles(
      segCoords,
      this.imagesTilesService.getElemExtent(segCoords),
      22
    );

    const canvas = new fabric.Canvas('canvas');
    const lado = Math.sqrt(tileCoords.length);
    canvas.width = lado * this.tileResolution;
    canvas.height = lado * this.tileResolution;
    const width = canvas.width / lado;
    const height = canvas.height / lado;
    let contador = 0;
    tileCoords.forEach((tileCoord, index) => {
      const url = GLOBAL.GIS + `${this.selectedInforme.id}_thermal/${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}.png`;

      const left = (index % lado) * width;
      const top = Math.trunc(index / lado) * height;

      fabric.util.loadImage(
        url,
        (img) => {
          if (img !== null) {
            img = this.imageProcessService.transformPixels(img);

            const image = new fabric.Image(img, {
              width,
              height,
              left,
              top,
              angle: 0,
              opacity: 1,
              draggable: false,
              lockMovementX: true,
              lockMovementY: true,
              scaleX: 1,
              scaleY: 1,
            });

            canvas.add(image);

            contador++;
            if (contador === tileCoords.length) {
              const tileGrid = this.layerInformeSelected.getSource().getTileGrid();
              const longLatOrigen = this.imagesTilesService.getLongLatFromXYZ(tileCoords[0], tileGrid);
              const longLatFin = this.imagesTilesService.getLongLatFromXYZ(tileCoords[tileCoords.length - 1], tileGrid);
              const coordsSegCanvas = this.getCoordsRectangleCanvas(longLatOrigen, longLatFin, segCoords, lado);

              if (anomalias !== undefined) {
                this.drawAnomaliasSeguidor(anomalias, canvas, longLatOrigen, longLatFin, lado);
              }

              this.imagesTilesService.canvasCenterAndZoom(coordsSegCanvas, canvas, true);

              if (anomalias !== undefined) {
                this.imageListBase64[`imgCanvasSegAnoms${count}`] = canvas.toDataURL({
                  format: 'png',
                });

                this.countLoadedImagesSegs1EjeAnoms++;
              } else {
                this.imageListBase64[`imgCanvasSegNoAnoms${count}`] = canvas.toDataURL({
                  format: 'png',
                });

                this.countLoadedImagesSegs1EjeNoAnoms++;
              }
            }
          } else {
            contador++;
            if (contador === tileCoords.length) {
              const tileGrid = this.layerInformeSelected.getSource().getTileGrid();
              const longLatOrigen = this.imagesTilesService.getLongLatFromXYZ(tileCoords[0], tileGrid);
              const longLatFin = this.imagesTilesService.getLongLatFromXYZ(tileCoords[tileCoords.length - 1], tileGrid);
              const coordsSegCanvas = this.getCoordsRectangleCanvas(longLatOrigen, longLatFin, segCoords, lado);

              if (anomalias !== undefined) {
                this.drawAnomaliasSeguidor(anomalias, canvas, longLatOrigen, longLatFin, lado);
              }

              this.imagesTilesService.canvasCenterAndZoom(coordsSegCanvas, canvas, true);

              if (anomalias !== undefined) {
                this.imageListBase64[`imgCanvasSegAnoms${count}`] = canvas.toDataURL({
                  format: 'png',
                });

                this.countLoadedImagesSegs1EjeAnoms++;
              } else {
                this.imageListBase64[`imgCanvasSegNoAnoms${count}`] = canvas.toDataURL({
                  format: 'png',
                });

                this.countLoadedImagesSegs1EjeNoAnoms++;
              }
            }
          }
        },
        null,
        { crossOrigin: 'anonymous' }
      );
    });
  }

  private drawAnomaliasSeguidor(
    anomalias: Anomalia[],
    canvas: any,
    coordsOrigen: number[][],
    coordsFin: number[][],
    lado: number
  ): void {
    anomalias.forEach((anom, index) => {
      const coordsAnomCanvas = this.getCoordsRectangleCanvas(coordsOrigen, coordsFin, anom.featureCoords, lado);
      this.imagesTilesService.drawPolygonInCanvas(anom.localId, canvas, coordsAnomCanvas, index + 1);
    });
  }

  private getXYZFromLongLat(long: number, lat: number, zoom): TileCoord {
    const xtile = Math.floor(((long + 180) / 360) * (1 << zoom));
    const ytile = Math.floor(
      ((1 - Math.log(Math.tan(this.toRad(lat)) + 1 / Math.cos(this.toRad(lat))) / Math.PI) / 2) * (1 << zoom)
    );
    return [zoom, xtile, ytile];
  }

  private toRad(value: number): number {
    // convierte grados a radianes
    return (value * Math.PI) / 180;
  }

  private setImgSeguidorCanvas(seguidor: Seguidor, vistaPrevia: boolean = false, folder?: string) {
    const anomaliasSeguidor = seguidor.anomaliasCliente as PcInterface[];

    let imageName = seguidor.anomalias[0].archivoPublico;
    if (seguidor.anomaliasCliente.length > 0) {
      imageName = seguidor.anomaliasCliente[0].archivoPublico;
    }

    // Creamos una referencia a la imagen
    const storageRef = this.storage.ref('');
    const imageRef = storageRef.child('informes/' + seguidor.informeId + '/' + folder + '/' + imageName);

    imageRef
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        fabric.util.loadImage(
          url,
          (img) => {
            if (img !== null) {
              const canvas = new fabric.Canvas('canvas');
              canvas.width = GLOBAL.resolucionCamara[1];
              canvas.height = GLOBAL.resolucionCamara[0];
              const image = new fabric.Image(img);

              image.set({
                left: 0,
                top: 0,
                angle: 0,
                opacity: 1,
                draggable: false,
                lockMovementX: true,
                lockMovementY: true,
                scaleX: 1,
                scaleY: 1,
              });

              canvas.add(image);
              this.drawAllPcsInCanvas(anomaliasSeguidor, canvas, vistaPrevia, 1, 0, 0);
              this.imageListBase64[`imgCanvas${seguidor.nombre}`] = canvas.toDataURL(
                'image/jpeg',
                this.imagesLoadService.jpgQuality
              );
            }

            this.countLoadedImages++;
          },
          null,
          { crossOrigin: 'anonymous' }
        );
      })
      .catch((error) => {
        const canvas = new fabric.Canvas('canvas');
        this.imageListBase64[`imgCanvas${seguidor.nombre}`] = canvas.toDataURL(
          'image/jpeg',
          this.imagesLoadService.jpgQuality
        );

        this.countLoadedImages++;

        switch (error.code) {
          case 'storage/object-not-found':
            console.log(`File doesn't exist`);
            break;

          case 'storage/unauthorized':
            console.log(`User doesn't have permission to access the object`);
            break;

          case 'storage/canceled':
            console.log('User canceled the upload');
            break;

          case 'storage/unknown':
            console.log('Unknown error occurred, inspect the server response');
            break;
        }
      });
  }

  private drawAllPcsInCanvas(pcs: PcInterface[], canvas, vistaPrevia: boolean = false, scale = 1, top0 = 0, left0 = 0) {
    let contadorPcs = 0;
    if (pcs.length > 0) {
      pcs.forEach((pc, i, a) => {
        contadorPcs++;
        this.drawAnomalia(pc, canvas, contadorPcs);
      });
    } else {
      canvas.renderAll();
    }
  }

  drawAnomalia(pc: PcInterface, canvas: any, contadorPc: number) {
    const polygon = new fabric.Rect({
      left: pc.img_left,
      top: pc.img_top,
      fill: 'rgba(0,0,0,0)',
      stroke: 'white',
      // stroke: this.seguidorViewService.getAnomaliaColor(anomalia),
      strokeWidth: 2,
      width: pc.img_width,
      height: pc.img_height,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      anomId: pc.id,
      ref: 'anom',
      selectable: false,
      hoverCursor: 'pointer',
      rx: 4,
      ry: 4,
    });
    const label = new fabric.Text(contadorPc.toString(), {
      left: pc.img_left,
      top: pc.img_top - 26,
      fontSize: 20,
      // textBackgroundColor: 'red',
      ref: 'text',
      selectable: false,
      hoverCursor: 'default',
      fill: 'white',
    });

    canvas.add(polygon);
    canvas.add(label);
    canvas.renderAll();
  }

  getPagesPDF() {
    // PORTADA //
    let widthLogoPortada = this.imagesLoadService.widthLogoEmpresa;
    // controlamos que la altura del logo no se salga de la portada
    const alturaMaxLogo = 250;
    if (this.imagesLoadService.heightLogoEmpresa > alturaMaxLogo) {
      const factorReduccion = alturaMaxLogo / this.imagesLoadService.heightLogoEmpresa;
      widthLogoPortada = this.imagesLoadService.widthLogoEmpresa * factorReduccion;
    }

    const portada: any[] = [
      {
        text: this.translation.t('Análisis termográfico aéreo de módulos fotovoltaicos'),
        style: 'h1',
        alignment: 'center',
      },

      '\n',

      {
        image: this.imgPortadaBase64,
        width: this.imagesLoadService.widthPortada,
        alignment: 'center',
      },

      '\n',

      {
        text: [
          {
            text: this.translation.t(`Planta solar:`),
            style: 'bold',
          },
          ' ',
          `${this.planta.nombre} (${this.planta.potencia} MW - ${this.translation.t(this.planta.tipo)})`,
        ],
        style: 'subtitulo',
      },

      {
        text: [
          {
            text: this.translation.t(`Fecha del vuelo:`),
            style: 'bold',
          },
          ' ',
          this.datePipe.transform(this.selectedInforme.fecha * 1000, 'dd/MM/yyyy'),
        ],
        style: 'subtitulo',
      },

      '\n\n',
      {
        image: this.imgLogoBase64,
        width: widthLogoPortada,
        alignment: 'center',
        margin: [10, 0, 0, 0],
      },
      {
        image: this.imgSolardroneBase64,
        width: this.imagesLoadService.widthImgSolardroneTech,
        absolutePosition: {
          x: this.imagesLoadService.widthPortada - this.imagesLoadService.widthImgSolardroneTech - 20,
          y:
            this.imagesLoadService.widthPortada * Math.sqrt(2) - this.imagesLoadService.widthImgSolardroneTech / 4 - 40, // aspect ratio logo 4:1
        },
        pageBreak: 'after',
      },
    ];

    const introduccion = (index: string) => {
      return [
        {
          text: `${this.translation.t(
            'Este documento contiene los resultados de la inspección termográfica realizada en la planta solar fotovoltaica de'
          )} ${this.planta.nombre} (${this.planta.potencia} MW - ${this.translation.t(this.planta.tipo)}).`,
          style: 'p',
        },

        '\n',

        {
          text: this.translation.t(
            'Las inspecciones termográficas en instalaciones solares fotovoltaicas forman parte del mantenimiento preventivo recomendado para este tipo de instalaciones y tienen como objetivo anticiparse a aquellos problemas en los paneles que no son detectables fácilmente de otra manera.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.translation.t(
            'Es importante que este mantenimiento sea llevado a cabo por profesionales, ya que una termografía mal realizada durante varios años puede afectar al estado general de la planta.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.translation.t(
            'Entre las ventajas de realizar termografía infrarroja de manera regular: permite aumentar la eficiencia de la planta (performance ratio) en el medio plazo, evitar reparaciones más costosas, aumentar la vida útil de los equipos, detectar problemas relacionados con distintos fabricantes de paneles, problemas de conexión entre módulos, problemas relacionados con la vegetación o la suciedad en los módulos... entre una larga lista de ventajas.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: `${this.translation.t(
            'La inspección ha sido realizada mediante vehículos aéreos no tripulados operados y diseñados a tal efecto'
          )} ${
            this.plantaService.getReferenciaSolardrone(this.planta)
              ? ` ${this.translation.t('por')} Solardrone. `
              : '. '
          } ${this.translation.t(
            'Se ha utilizado la más avanzada tecnología al servicio de la fotovoltaica con el fin de reducir al mínimo el tiempo y el coste de operación sin renunciar a la más alta calidad y fiabilidad. El equipo de que ha realizado el presente documento cuenta con personal formado en Termografía Infrarroja Nivel 1.'
          )}`,
          style: 'p',
        },

        '\n\n',
      ];
    };

    const criterios = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Criterios de operación')}`,
          style: 'h3',
          pageBreak: 'before',
          margin: [0, 10, 0, 0],
        },

        '\n',

        {
          text: `${this.translation.t('El criterio base que')} ${
            this.plantaService.getReferenciaSolardrone(this.planta) ? ' Solardrone' : this.translation.t(' se')
          } ${this.translation.t(
            'ha seguido para realizar esta inspección termográfica es la norma internacional para inspecciones termográficas IEC 62446-3. En la misma se define cómo deben realizarse las termografías infrarrojas de módulos fotovoltaicos en plantas durante su operación'
          )}`,
          style: 'p',
        },

        '\n',

        {
          text: this.translation.t('Hay dos niveles de inspección termográfica según la norma IEC 62446-3:'),
          style: 'p',
        },

        '\n',

        {
          ul: [
            {
              text: [
                {
                  text: this.translation.t('Inspección simplificada'),
                  bold: true,
                },
                `: ${this.translation.t(
                  'Esta es una inspección limitada para verificar que los módulos están funcionando, con requisitos reducidos para el personal. Este tipo de inspecciones se usan, por ejemplo, durante una puesta en marcha básica de una planta fotovoltaica'
                )}.\n\n`,
              ],
              style: 'p',
            },
            {
              text: [
                {
                  text: this.translation.t('Inspección detallada'),
                  bold: true,
                },
                `: ${this.translation.t(
                  'Requiere una comprensión más profunda de las anomalías térmicas. Puede ser utilizado para inspecciones periódicas de acuerdo con a la serie IEC 62446 y para solucionar problemas en sistemas con un bajo rendimiento. Se realizan mediciones de temperatura absoluta. Un experto autorizado en plantas fotovoltaicas, junto con exportos termógrafos, pueden llevar a cabo este tipo de inspecciones'
                )} .`,
              ],
              style: 'p',
            },
          ],
        },

        '\n',

        {
          text: this.translation.t(
            'La termografía realizada entra dentro de las inspecciones detalladas indicadas por la norma, cumpliendo con los requisitos que indica la misma, que son:'
          ),
          style: 'p',
        },

        '\n',

        {
          ul: [
            {
              text: this.translation.t('Medición absoluta de temperaturas: con un error menor de 2 ºC.'),
              style: 'p',
            },
            {
              text: this.translation.t('Medición de temperatura máxima, media y gradiente.'),
              style: 'p',
            },
            {
              text: this.translation.t(
                'Informe realizado por un experto en termografía infrarroja en conjunto con un experto en fotovoltaica.'
              ),
              style: 'p',
            },
            {
              text: this.translation.t('Recomendación para cada tipo de anomalía registrada.'),
              style: 'p',
            },
            {
              text: this.translation.t('Resolución geométrica térmica: 5x5 pixels por cada célula fotovoltaica.'),
              style: 'p',
            },
            {
              text: this.translation.t('Resolución geométrica visual: 25x25 pixels por cada célula fotovoltaica.'),
              style: 'p',
            },
            {
              text: this.translation.t(
                'Condiciones ambientales correctas: temperatura ambiente, viento, nubosidad e irradiancia.'
              ),
              style: 'p',
            },
            {
              text: this.translation.t('Calibración de los equipos: cada 2 años.'),
              style: 'p',
            },
            {
              text: this.translation.t(
                'Parámetros térmicos: el ajuste de la emisividad y la temperatura reflejada es imprescindible para una correcta medición de las temperaturas. Es necesario hacer las mediciones oportunas en campo para poder obtener estos parámetros, ya que dependen de la atmósfera, la meteorología, la suciedad en los módulos el día del vuelo y de los materiales del propio módulo.'
              ),
              style: 'p',
            },
            {
              text: this.translation.t(
                'Documentación: el entregable incluye las imágenes radiométricas y visuales originales junto con todos los datos que requiere la norma.'
              ),
              style: 'p',
            },
            {
              text: this.translation.t('Trayectoria: que asegure el cumplimiento de la norma.'),
              style: 'p',
            },
            {
              text: this.translation.t('Velocidad: 10 km/h máximo.'),
              style: 'p',
            },
          ],
        },
        {
          text: '\n\n',
        },
      ];
    };

    const normalizacion = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Normalización de gradientes de temperatura')}`,
          style: 'h3',
          pageBreak: 'before',
          margin: [0, 10, 0, 0],
        },

        '\n',

        {
          text: [
            this.translation.t('Con el fin de poder ver la '),
            {
              text: this.translation.t('evolución de las anomalías térmicas con el tiempo'),
              style: 'bold',
            },
            ' ',
            this.translation.t(
              'comparando inspecciones termográficas llevadas a cabo en distintos meses o años (con condiciones ambientales distintas), es necesario contar con un procedimiento que permita normalizar los gradientes de temperatura.'
            ),
          ],
          style: 'p',
        },

        '\n',

        {
          text: this.translation.t(
            "Por este motivo todas las anomalías registradas tienen asociada su 'gradiente normalizado', que es el gradiente de temperatura equivalente a haber realizado la inspección con una irradiancia de 1000 W/m2. Esto permitirá poder comparar los resultados de la presente inspección con otras futuras realizadas en condiciones ambientales diferentes y así poder tener una evolución fidedigna de cada una de las anomalías."
          ),
          style: 'p',
        },

        '\n\n',
      ];
    };

    const datosVuelo = (index: string) => {
      const apt01 = [
        [
          {
            text: this.translation.t('Vehículo aéreo no tripulado'),
            style: 'tableHeaderBlue',
            colSpan: 2,
            alignment: 'center',
          },
          {},
        ],
        [
          {
            text: this.translation.t('Aeronave'),
            style: 'tableLeft',
          },
          {
            text: `${DRONE.model}`,
          },
        ],
        [
          {
            text: this.translation.t('Cámara térmica'),
            style: 'tableLeft',
          },
          {
            text: `${this.translation.t(DRONE.camaraTermica)}`,
          },
        ],
        [
          {
            text: this.translation.t('Última calibración'),
            style: 'tableLeft',
          },
          {
            text: `${DRONE.ultimaCalibracion}`,
          },
        ],
      ];

      const apt02 = [
        [
          {
            text: this.translation.t('Datos del vuelo'),
            style: 'tableHeaderBlue',
            colSpan: 2,
            alignment: 'center',
          },
          {},
        ],
        [
          {
            text: this.translation.t('Fecha'),
            style: 'tableLeft',
          },
          {
            text: this.datePipe.transform(this.selectedInforme.fecha * 1000, 'dd/MM/yyyy'),
          },
        ],
        [
          {
            text: this.translation.t('GSD térmico (medio)'),
            style: 'tableLeft',
          },
          {
            text: `${this.selectedInforme.gsd} cm/pixel (+- 0.5cm/pixel)`,
          },
        ],

        [
          {
            text: this.translation.t('GSD visual'),
            style: 'tableLeft',
          },
          {
            text: `${Math.round(this.selectedInforme.gsd * 0.16 * 100) / 100} cm/pixel`,
          },
        ],
      ];

      const apt03 = [
        [
          {
            text: this.translation.t('Datos meteorológicos'),
            style: 'tableHeaderBlue',
            colSpan: 2,
            alignment: 'center',
          },
          {},
        ],

        [
          {
            text: this.translation.t('Temperatura del aire'),
            style: 'tableLeft',
          },
          {
            text: `${this.selectedInforme.temperatura} ºC`,
          },
        ],

        [
          {
            text: this.translation.t('Nubosidad'),
            style: 'tableLeft',
          },
          {
            text: `${this.selectedInforme.nubosidad}/8 ${this.translation.t('octavas')}`,
          },
        ],
      ];

      if (this.selectedInforme.hasOwnProperty('hora_inicio')) {
        apt02.push([
          {
            text: this.translation.t('Horario de los vuelos'),
            style: 'tableLeft',
          },
          {
            text: `${this.selectedInforme.hora_inicio} - ${this.selectedInforme.hora_fin}`,
          },
        ]);
      }

      if (this.selectedInforme.hasOwnProperty('velocidad')) {
        if (
          this.selectedInforme.velocidad !== undefined &&
          this.selectedInforme.velocidad !== null &&
          !isNaN(this.selectedInforme.velocidad)
        ) {
          apt02.push([
            {
              text: this.translation.t('Velocidad'),
              style: 'tableLeft',
            },
            {
              text: `${this.selectedInforme.velocidad} km/h`,
            },
          ]);
        }
      }

      if (this.irradianciaMedia !== undefined && this.irradianciaMedia !== null && !isNaN(this.irradianciaMedia)) {
        apt03.push([
          {
            text: this.translation.t('Irradiancia (media)'),
            style: 'tableLeft',
          },
          {
            text: `${this.irradianciaMedia} W/m2`,
          },
        ]);
      }

      if (this.selectedInforme.hasOwnProperty('vientoVelocidad')) {
        apt03.push([
          {
            text: 'Viento',
            style: 'tableLeft',
          },
          {
            text: `${this.selectedInforme.vientoVelocidad} (Beaufort) ${this.selectedInforme.vientoDireccion}º`,
          },
        ]);
      }

      const body = [...apt01, ...apt02, ...apt03];

      return [
        {
          text: `${index} - ${this.translation.t('Datos del vuelo')}`,
          style: 'h3',
          pageBreak: 'before',
          margin: [0, 10, 0, 0],
        },

        '\n',

        {
          text: this.translation.t('Las condiciones durante le vuelo han sido las siguientes:'),
          style: 'p',
        },

        '\n',

        {
          columns: [
            {
              width: '*',
              text: '',
            },

            {
              width: 'auto',
              table: {
                body,
              },
            },

            {
              width: '*',
              text: '',
            },
          ],
        },

        '\n\n',
      ];
    };

    const irradiancia = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Irradiancia durante el vuelo')}`,
          style: 'h3',
          pageBreak: 'before',
          margin: [0, 10, 0, 0],
        },

        '\n',

        {
          text: this.getTextoIrradiancia(),
          style: 'p',
        },

        '\n',

        {
          image: this.imgIrradianciaBase64,
          width: this.imagesLoadService.widthIrradiancia,
          alignment: 'center',
        },

        '\n\n',
      ];
    };

    const paramsTermicos = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Ajuste de parámetros térmicos')}`,
          style: 'h3',
          pageBreak: 'before',
          margin: [0, 10, 0, 0],
        },

        '\n',

        {
          text: [
            this.translation.t(
              'Con el fin de obtener medidas de temperaturas absolutas fiables, es necesario tener en cuenta distintas variables térmicas que afectan directamente al resultado de las medidas obtenidas por las cámaras. Las más importantes son'
            ),
            ' ',
            {
              text: this.translation.t('la emisividad'),
              style: 'bold',
            },
            ' ',
            this.translation.t('y la'),
            ,
            ' ',
            {
              text: this.translation.t('temperatura reflejada'),
              style: 'bold',
            },
            '.',
          ],
          style: 'p',
        },

        '\n',

        {
          text: `${index}.1 - ${this.translation.t('Emisividad')}`,
          style: 'h4',
        },

        '\n',

        {
          text: this.translation.t(
            'La emisividad del material se mide de manera experimental en campo y depende del tipo de vidrio de los módulos y de la suciedad que presenten el día del vuelo. La emisividad escogida por el termógrafo tras el ensayo experimental es la siguiente:'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.translation.t('Emisividad') + '  = ' + this.selectedInforme.emisividad.toString(),
          style: 'param',
        },

        '\n',

        // Imagen suciedad
        {
          image: this.imgSuciedadBase64,
          width: this.imagesLoadService.widthSuciedad,
          alignment: 'center',
        },

        '\n\n',

        {
          text: `${index}.2 - ${this.capFirstLetter(this.translation.t('temperatura reflejada'))}`,
          style: 'h4',
        },

        '\n',

        {
          text: this.translation.t(
            'La temperatura reflejada no depende de la atmósfera y las condiciones meteorológicas del día del vuelo. Para obtener este parámetro es necesario llevar a cabo un procedimiento de medición adecuado en la misma planta el mismo día del vuelo. La temperatura reflejada medida es:'
          ),
          style: 'p',
        },

        '\n',

        {
          text:
            this.capFirstLetter(this.translation.t('temperatura reflejada')) +
            ' = ' +
            this.selectedInforme.tempReflejada.toString() +
            ' ºC',
          style: 'param',
        },

        // '\n\n',
      ];
    };

    const perdidaPR = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Pérdida de Performance Ratio')} (ΔPR)`,
          style: 'h3',
          pageBreak: 'before',
          margin: [0, 10, 0, 0],
        },

        '\n',

        {
          text:
            this.translation.t(
              'El coeficiente de rendimiento de sistemas fotovoltaicos o Performance Ratio es un parámetro que tuvo su origen conceptual en la norma IES 61724 (1998) para ser utilizado como indicador de calidad en la evaluación de sistemas fotovoltaicos'
            ) + '.\n\n',
          style: 'p',
        },

        {
          text: this.translation.t(
            'Este parámetro se utiliza para medir el rendimiento de cualquier sistema fotovoltaico. En otras palabras, si queremos saber si un módulo está generando la energía que debería bastaría con conocer su PR. No podemos conocer el PR de cada módulo con una termografía, pero lo que sí podemos conocer es la pérdida de PR (ΔPR) producida por anomalía térmica respecto a sus condiciones ideales. Es decir, un módulo con un punto caliente que causa una ΔPR = -1% tiene menos importancia que una anomalía que causa una ΔPR = -33%, el cual está haciendo caer la producción eléctrica del módulo en un 33%.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.translation.t(
            'La pérdida de PR nos indica, por tanto, lo perjudicial que es una anomalía térmica, identificando explícitamente los puntos sobre los que se debe actuar para optimizar la producción eléctrica. Es un parámetro indispensable en el diagnóstico termográfico de una instalación fotovoltaica, ya que nos permite tomar decisiones en base a un dato técnico-económico objetivo.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.translation.t('Para poder evaluar la planta utilizaremos los siguientes dos sencillos conceptos:'),
          style: 'p',
        },

        '\n',

        {
          text: `${index}.1 - ${this.translation.t('Pérdidas de performance ratio')} (ΔPR)`,
          style: 'h4',
        },

        '\n',

        {
          text: this.translation.t(
            'Cada incidencia tiene una variación de performance ratio asociado. Por ejemplo, un diodo bypass en circuito abierto produce que el módulo trabaje al 15% de eficiencia en un caso típico (ΔPR=85%), mientras que una célula caliente aislada produce de media < 1% de pérdidas.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: `${index}.2 - ${this.translation.t('Módulos apagados equivalentes')}`,
          style: 'h4',
        },

        '\n',

        {
          text: this.translation.t(
            "El concepto 'módulos apagados equivalentes' es la cantidad equivalente de módulos que no generan energía debido a las incidencias registradas en la planta. Por ejemplo, si tenemos tres módulos idénticos con un defecto en un diodo bypass cada uno, cada módulo genera un 33% menos de energía. Entonces, el número de módulos apagados equivalentes es 1."
          ),
          style: 'p',
        },

        {
          text: this.translation.t(
            'Uniendo los dos conceptos anteriores, se puede hacer una estimación “grosso modo” de la variación de PR de la planta de la siguiente manera:'
          ),
          style: 'p',
        },

        {
          image: this.imgFormulaMaeBase64,
          width: this.imagesLoadService.widthFormulaMae,
          alignment: 'center',
        },

        {
          text: this.translation.t(
            'Siendo N = Número de módulos; PR = Performance ratio; MAE = Módulos apagados equivalente calculados'
          ),
          style: 'pieFoto',
        },

        '\n\n',

        {
          text: this.translation.t(
            'Por lo tanto, sabiendo el MAE sabremos cuánto PR estamos perdiendo debido a las incidencias encontradas.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.translation.t(
            'El objetivo será obtener un MAE bajo, lo cual nos indicará un correcto mantenimiento de la planta.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: `${this.translation.t('Teniendo en cuenta todas las plantas fotovoltaicas inspeccionadas')}  ${
            this.plantaService.getReferenciaSolardrone(this.planta) ? ` ${this.translation.t('por')} Solardrone,` : ','
          } ${this.translation.t(
            "se puede hacer una clasificación estadística según el MAE. Según la siguiente tabla, podemos clasificar el mantenimiento de una planta en 3 tipos: muy bueno (por debajo de la media), correcto (en la media) y 'mejorable' (por encima de la media):"
          )}`,
          style: 'p',
        },

        '\n',

        // Imagen maeCurva
        {
          image: this.imgCurvaMaeBase64,
          width: this.imagesLoadService.widthCurvaMae,
          alignment: 'center',
        },

        '\n\n',

        {
          columns: [
            {
              width: '*',
              text: '',
            },

            {
              width: 'auto',
              table: {
                body: [
                  [
                    {
                      text: this.translation.t('MAE de la planta'),
                      style: 'tableHeader',
                    },
                    {
                      text: this.capFirstLetter(this.translation.t('estado')),
                      style: 'tableHeader',
                    },
                  ],
                  [
                    {
                      text: '% MAE < ' + GLOBAL.mae[0] + '%',
                      style: ['mae1', 'bold'],
                    },
                    {
                      text: this.capFirstLetter(this.translation.t('muy bueno')),
                      style: 'mae1',
                    },
                  ],
                  [
                    {
                      text: GLOBAL.mae[0] + '%' + ' < % MAE <  ' + GLOBAL.mae[1] + '%',
                      style: ['mae2', 'bold'],
                    },
                    {
                      text: this.capFirstLetter(this.translation.t('correcto')),
                      style: 'mae2',
                    },
                  ],
                  [
                    {
                      text: '% MAE > ' + GLOBAL.mae[1] + '%',
                      style: ['mae3', 'bold'],
                    },
                    {
                      text: this.capFirstLetter(this.translation.t('mejorable')),
                      style: 'mae3',
                    },
                  ],
                ],
              },
            },

            {
              width: '*',
              text: '',
            },
          ],
        },

        '\n\n',
      ];
    };

    const clasificacion = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Cómo se clasifican las anomalías térmicas (según IEC 62446-3)')}`,
          style: 'h3',
          pageBreak: 'before',
          margin: [0, 10, 0, 0],
        },

        '\n',

        {
          text: this.translation.t(
            'Según la norma internacional IEC 62446-3 para inspecciones termográficas de instalaciones fotovoltaicas, las anomalías térmicas se clasifican en tres clases o CoA (Class of Abnormalitys):'
          ),
          style: 'p',
        },

        '\n',

        {
          ul: [
            {
              text: [
                {
                  text: `CoA 1 - ${this.translation.t('sin anomalía')}`,
                  style: ['coa1', 'bold'],
                },
                `: ${this.translation.t('hacemos seguimiento, pero no hay que actuar.')}`,
              ],
              style: 'p',
            },
            {
              text: [
                {
                  text: `CoA 2 - ${this.translation.t('anomalía térmica')}`,
                  style: ['coa2', 'bold'],
                },
                ': ',
                this.translation.t('ver la causa y, si es necesario, arreglar en un periodo razonable.'),
              ],
              style: 'p',
            },
            {
              text: [
                {
                  text: `CoA 3 - ${this.translation.t('anomalía térmica relevante para la seguridad')}`,
                  style: ['coa3', 'bold'],
                },
                `: ${this.translation.t(
                  'próxima interrupción de la operación normal del módulo, detectar la causa y rectificar en un periodo razonable.'
                )}`,
              ],
              style: 'p',
            },
          ],
        },

        '\n\n',
      ];
    };

    const planoTermico = (index: string) => {
      return [
        // Imagen planta termica
        {
          text: `${index} - ${this.translation.t('Ortomosaico térmico')}`,
          style: 'h2',
          margin: [0, 10, 0, 40],
          alignment: 'center',
          pageBreak: 'before',
        },
        {
          image: this.imagesPlantaCompleta['thermal'],
          width: this.widthPlano,
          alignment: 'center',
        },
      ];
    };

    const planoVisual = (index: string) => {
      return [
        // Imagen planta visual
        {
          text: `${index} - ${this.translation.t('Ortomosaico RGB')}`,
          style: 'h2',
          margin: [0, 10, 0, 40],
          alignment: 'center',
          pageBreak: 'before',
        },
        {
          image: this.imagesPlantaCompleta['visual'],
          width: this.widthPlano,
          alignment: 'center',
        },
      ];
    };

    const resultados = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Resultados de la inspección termográfica')}`,
          style: 'h2',
          margin: [0, 10, 0, 0],
          alignment: 'center',
          pageBreak: 'before',
        },

        {
          text: '',
          style: 'p',
        },

        '\n\n',
      ];
    };

    const resultadosClase = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Resultados por clase de anomalía')} (CoA)`,
          style: 'h3',
        },

        '\n',

        {
          text: this.translation.t(
            'A continuación se detalla la cantidad de incidencias registradas según su clase (1, 2 ó 3).'
          ),
          style: 'p',
        },

        {
          text: [
            `${this.translation.t('Se han registrado un total de')} `,
            { text: this.countClase[0] + this.countClase[1] + this.countClase[2], style: 'bold' },
            ` ${this.translation.t('anomalías térmicas, de las cuales')} ${this.countClase[0]} ${this.translation.t(
              'son de clase'
            )} 1, ${this.countClase[1]} ${this.translation.t('son de clase')} 2  ${this.translation.t('y')} ${
              this.countClase[2]
            } ${this.translation.t('son de clase')} 3.`,
          ],
          style: 'p',
        },

        '\n\n',
      ];
    };

    const resultadosCategoria = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Resultados por categoría de la anomalía')}`,
          style: 'h3',
        },

        '\n',

        {
          text: `${this.translation.t(
            'La siguiente tabla muestra la cantidad de anomalías térmicas por categoría. En el caso de células calientes, sólo se incluyen aquellas con gradientes mayores a'
          )} ${this.currentFiltroGradiente} ºC`,
          style: 'p',
        },

        '\n',

        {
          columns: [
            {
              width: '*',
              text: '',
            },
            {
              width: 'auto',
              table: {
                body: [
                  [
                    {
                      text: this.translation.t('Categoría'),
                      style: 'tableHeaderBlue',
                    },

                    {
                      text: this.translation.t('Cantidad'),
                      style: 'tableHeaderBlue',
                    },

                    {
                      text: this.translation.t('Porcentaje %'),
                      style: 'tableHeaderBlue',
                    },
                  ],
                ]
                  .concat(this.getTablaCategoria())
                  .concat([
                    [
                      {
                        text: 'TOTAL',
                        style: 'bold',
                      },
                      {
                        text: this.anomaliasInforme.length.toString(),
                        style: 'bold',
                      },
                      {
                        text: '100%',
                        style: 'bold',
                      },
                    ],
                  ]),
              },
            },

            {
              width: '*',
              text: '',
              pageBreak: 'after',
            },
          ],
        },

        '\n\n',
      ];
    };

    const resultadosSeguidor = (index: string) => {
      const numAnomaliasMedia = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 2 }).format(
        this.anomaliasInforme.length / this.seguidoresInforme.length
      );
      let numeroSeguidores = 0;
      let porcentajeSeguidores = 0;
      if (this.planta.hasOwnProperty('numeroSeguidores')) {
        numeroSeguidores = this.seguidoresInforme.length;
        porcentajeSeguidores = (this.seguidoresInforme.length / numeroSeguidores) * 100;
      }
      return [
        {
          text: `${index} - ${this.translation.t('Resultados por seguidores')}`,
          style: 'h3',
        },

        '\n',
        `${this.translation.t('El número de seguidores afectados por anomalías térmicas es')} ${
          this.seguidoresInforme.length
        }${
          numeroSeguidores === 0 ? '. ' : `/${numeroSeguidores} (${porcentajeSeguidores.toFixed(2)}%). `
        } ${this.translation.t(
          'El número medio de módulos con anomalías por seguidor es de'
        )} ${numAnomaliasMedia} ${this.translation.t('módulos/seguidor')}.`,
        '\n',
        '\n',
      ];
    };

    const resultadosPosicion = (index: string) => {
      let titulo;
      let texto1;
      let body;
      if (this.reportControlService.plantaFija) {
        titulo = this.translation.t('Resultados por altura');
        texto1 = this.translation.t(
          'Los números de la siguiente tabla indican la cantidad de anomalías térmicas registradas por altura y su porcentaje sobre el total. Sólo se incluyen anomalías térmicas de clase 2 y 3.'
        );
        body = this.getTablaAltura();
      } else {
        titulo = this.translation.t('Resultados por posición de la anomalía dentro del seguidor');
        texto1 = `${this.translation.t(
          'Los números de la siguiente tabla indican la cantidad de anomalías térmicas registradas en la posición en la que se encuentran'
        )} (${this.plantaService.getNombreLocalX(this.planta)} ${this.translation.t(
          'y'
        )} ${this.plantaService.getNombreLocalY(this.planta)}) ${this.translation.t(
          'dentro de cada seguidor. Sólo se incluyen anomalías térmicas de clase 2 y 3.'
        )}`;
        body = this.getTablaPosicion();
      }
      return [
        {
          text: `${index} - ${titulo}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.translation.t(
            'Esta clasificación tiene como fin detectar posibles problemas relacionados con la posición de cada módulo. De este análisis se obtienen problemas relacionados con la vegetación de la instalación, deposiciones de pájaros, etc.'
          ),
          style: 'p',
        },
        '\n',

        {
          text: texto1,
          style: 'p',
        },

        '\n',

        {
          columns: [
            {
              width: '*',
              text: '',
            },

            {
              width: 'auto',
              table: {
                body,
              },
            },
            {
              width: '*',
              text: '',
            },
          ],
        },

        '\n',
      ];
    };

    const resultadosMAE = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('MAE de la planta')}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.translation.t(
            'El MAE (módulo apagados equivalentes) nos da una medida cualitativa del impacto que tienen las incidencias registradas en el PR (performance ratio) de la planta.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: `MAE = ∆PR / PR = ${this.decimalPipe.transform(
            this.selectedInforme.mae * 100,
            '1.0-2'
          )}% (${this.calificacionMae(this.selectedInforme.mae * 100)})`,
          style: 'param',
        },

        '\n',

        {
          text: [
            `${this.translation.t('El MAE de')} ${this.planta.nombre} (${this.datePipe.transform(
              this.selectedInforme.fecha * 1000,
              'dd/MM/yyyy'
            )}) ${this.translation.t('es')} `,
            {
              text: `${this.decimalPipe.transform(this.selectedInforme.mae * 100, '1.0-2')}%`,
              style: 'bold',
            },
            ' ',
            '(',
            {
              text: `${this.calificacionMae(this.selectedInforme.mae * 100)}`,
              style: 'bold',
            },
            ')',
          ],
          style: 'p',
        },
      ];
    };

    let result = portada;

    let titulo = 1;
    let subtitulo = 1;
    let apartado: string;

    result = result.concat([
      {
        text: `1 - ${this.translation.t('Introducción')}`,
        style: 'h2',
        margin: [0, 10, 0, 0],
        alignment: 'center',
      },

      '\n',
    ]);

    if (this.filtroApartados.includes('introduccion')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(introduccion(apartado));
    }

    if (this.filtroApartados.includes('criterios')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(criterios(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes('normalizacion')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(normalizacion(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes('datosVuelo')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(datosVuelo(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes('irradiancia')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(irradiancia(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes('paramsTermicos')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(paramsTermicos(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes('perdidaPR')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(perdidaPR(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes('clasificacion')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(clasificacion(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes('planoTermico')) {
      titulo = titulo + 1;
      apartado = titulo.toString();
      result = result.concat(planoTermico(apartado));
    }

    if (this.filtroApartados.includes('planoVisual')) {
      titulo = titulo + 1;
      apartado = titulo.toString();
      result = result.concat(planoVisual(apartado));
    }

    titulo = titulo + 1;
    subtitulo = 1;
    apartado = titulo.toString();

    result = result.concat(resultados(apartado));

    if (this.filtroApartados.includes('resultadosClase')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(resultadosClase(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes('resultadosCategoria')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(resultadosCategoria(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes('resultadosPosicion')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(resultadosPosicion(apartado));
      subtitulo = subtitulo + 1;
    }
    if (this.filtroApartados.includes('resultadosSeguidor')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(resultadosSeguidor(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes('resultadosMAE') && !this.hasUserArea) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(resultadosMAE(apartado));
      subtitulo = subtitulo + 1;
    }

    return result;
  }

  getAnexoLista(numAnexo: string) {
    const allPagsAnexoLista = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n ${this.translation.t('Anexo')} ${numAnexo}: ${this.translation.t(
        'Listado de anomalías térmicas'
      )}`,
      style: 'h1',
      alignment: 'center',
      pageBreak: 'before',
    };

    allPagsAnexoLista.push(pag1Anexo);

    allPagsAnexoLista.push({
      text: '',
      pageBreak: 'after',
    });

    // Header
    const cabecera = [];
    cabecera.push({
      text: this.translation.t('Número'),
      style: 'tableHeaderBlue',
    });

    cabecera.push({
      text: this.translation.t('Posición GPS'),
      style: 'tableHeaderBlue',
    });

    if (this.reportControlService.plantaFija) {
      cabecera.push({
        text: this.translation.t(
          'Localización'
        ) /* + ' (' + this.plantaService.getLabelNombreGlobalCoords(this.planta) + ')' */,
        style: 'tableHeaderBlue',
        noWrap: true,
      });
    } else {
      cabecera.push({
        text: this.translation.t('Seguidor'),
        style: 'tableHeaderBlue',
        noWrap: true,
      });
    }

    for (const c of this.columnasAnomalia) {
      cabecera.push({
        text: this.translation.t(this.getEncabezadoTablaSeguidor(c)),
        style: 'tableHeaderBlue',
      });
    }

    // Body
    const body = [];
    const totalAnoms = this.anomaliasInforme.length;
    for (const anom of this.anomaliasInforme) {
      let gpsLink = '';
      if (this.reportControlService.plantaFija) {
        gpsLink = this.anomaliaInfoService.getGoogleMapsUrl(this.olMapService.getCentroid(anom.featureCoords));
      } else {
        const seguidor = this.seguidoresInforme.find((seg) => seg.nombre === anom.nombreSeguidor);

        gpsLink = this.anomaliaInfoService.getGoogleMapsUrl(this.olMapService.getCentroid(seguidor.featureCoords));
      }

      const row = [];
      row.push({
        text: `${anom.numAnom}/${totalAnoms}`,
        noWrap: true,
        style: 'tableCellAnexo1',
      });
      row.push({
        text: 'link',
        link: gpsLink,
        noWrap: true,
        style: 'linkCellAnexo1',
      });
      row.push({
        text: this.getGlobalCoordsLabel(anom),
        noWrap: true,
        style: 'tableCellAnexo1',
      });
      for (let c of this.columnasAnomalia) {
        row.push({
          text: this.translation.t(this.getTextoColumnaAnomalia(anom, c.nombre)),
          noWrap: true,
          style: 'tableCellAnexo1',
        });
      }
      body.push(row);
    }

    const tablaAnexo = [
      {
        columns: [
          {
            width: '*',
            text: '',
          },
          {
            width: 'auto',
            table: {
              headerRows: 1,
              body: [cabecera].concat(body),
            },
          },
          {
            width: '*',
            text: '',
          },
        ],
      },

      {
        text: '',
      },
    ];

    return allPagsAnexoLista.concat(tablaAnexo);
  }

  private getAnexoAnomalias(numAnexo: string) {
    const allPagsAnexo = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n ${this.translation.t('Anexo')} ${numAnexo}: ${this.translation.t(
        'Anomalías térmicas'
      )}`,
      style: 'h1',
      alignment: 'center',
      pageBreak: 'before',
    };

    allPagsAnexo.push(pag1Anexo);

    for (let i = 0; i < this.anomaliasInforme.length; i++) {
      const anom = this.anomaliasInforme[i];

      const pagAnexo = [
        {
          text: `${this.translation.t('Anomalía')} ${i + 1}/${this.anomaliasInforme.length}`,
          style: 'h2',
          alignment: 'center',
          pageBreak: 'before',
        },
        '\n',
        {
          image: `imgCanvas${anom.id}`,
          width: this.widthImageAnomalia,
          alignment: 'center',
        },
        {
          columns: [
            { text: this.translation.t('Tipo de anomalía'), width: 200, style: 'anomInfoTitle' },
            { text: this.anomaliaInfoService.getTipoLabel(anom), style: 'anomInfoValue' },
          ],
          margin: [0, 40, 0, 0],
        },
        {
          columns: [
            { text: this.translation.t('Causa'), width: 200, style: 'anomInfoTitle' },
            {
              text: this.anomaliaInfoService.getCausa(anom),
              style: 'anomInfoValue',
              margin: [0, 0, 0, 5],
            },
          ],
        },
        {
          columns: [
            { text: this.translation.t('Recomendación'), width: 200, style: 'anomInfoTitle' },
            {
              text: this.anomaliaInfoService.getRecomendacion(anom),
              style: 'anomInfoValue',
              margin: [0, 0, 0, 5],
            },
          ],
        },
        {
          columns: [
            { text: this.translation.t('Módulo'), width: 200, style: 'anomInfoTitle' },
            { text: this.anomaliaInfoService.getModuloLabel(anom), style: 'anomInfoValue' },
          ],
        },
        {
          columns: [
            {
              text:
                this.translation.t('Criticidad') +
                this.translation.t('Criterio') +
                ' ' +
                this.anomaliaService.criterioCriticidad.nombre +
                ')',
              width: 200,
              style: 'anomInfoTitle',
            },
            {
              text: this.anomaliaInfoService.getCriticidadLabel(anom),
              style: 'anomInfoValue',
            },
          ],
        },
        {
          columns: [
            { text: this.translation.t('Clase'), width: 200, style: 'anomInfoTitle' },
            { text: this.anomaliaInfoService.getClaseLabel(anom), style: 'anomInfoValue' },
          ],
        },
        {
          columns: [
            { text: this.translation.t('Pérdidas') + ' (beta)', width: 200, style: 'anomInfoTitle' },
            { text: this.anomaliaInfoService.getPerdidasLabel(anom), style: 'anomInfoValue' },
          ],
        },
        {
          columns: [
            { text: this.translation.t('Temperatura máxima'), width: 200, style: 'anomInfoTitle' },
            { text: this.anomaliaInfoService.getTempMaxLabel(anom), style: 'anomInfoValue' },
          ],
        },
        {
          columns: [
            { text: this.translation.t('Gradiente temp. Normalizado'), width: 200, style: 'anomInfoTitle' },
            { text: this.anomaliaInfoService.getGradNormLabel(anom), style: 'anomInfoValue' },
          ],
        },
        {
          columns: [
            { text: this.translation.t('Fecha y hora captura'), width: 200, style: 'anomInfoTitle' },
            {
              text: this.anomaliaInfoService.getFechaHoraLabel(anom),
              style: 'anomInfoValue',
            },
          ],
        },
        {
          columns: [
            { text: this.translation.t('Localización'), width: 200, style: 'anomInfoTitle' },
            { text: this.anomaliaInfoService.getLocalizacionCompleteLabel(anom, this.planta), style: 'anomInfoValue' },
          ],
        },
        {
          columns: [
            { text: this.translation.t('Posición GPS'), width: 200, style: 'anomInfoTitle' },
            {
              text: 'link',
              link: this.anomaliaInfoService.getGoogleMapsUrl(anom.featureCoords[0]),
              style: 'linkAnomInfo',
            },
          ],
        },
      ];

      allPagsAnexo.push(pagAnexo);
    }

    return allPagsAnexo;
  }

  private getAnexoSegs1EjeAnoms(numAnexo: string) {
    const allPagsAnexo = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n ${this.translation.t('Anexo')} ${numAnexo}: ${this.translation.t(
        'Anomalías térmicas por seguidor'
      )}`,
      style: 'h1',
      alignment: 'center',
      pageBreak: 'before',
    };

    allPagsAnexo.push(pag1Anexo);

    for (let i = 0; i < this.seguidores1ejeAnoms.length; i++) {
      const segTable = this.getSeg1ejeTable();

      const anoms = this.anomSeguidores1Eje[i];

      const anomsTable = this.getPaginaSeguidor1EjeAnoms(anoms);

      const pagAnexo = [
        {
          // text: `${this.translation.t('Seguidor')} ${this.globalCoordsLabel(seg.globalCoords)}`,
          text: `${i + 1}/${this.seguidores1ejeAnoms.length} - ${this.translation.t(
            'Seguidor'
          )} ${this.downloadReportService.getNombreS1E(this.seguidores1ejeAnoms[i])}`,
          style: 'h2',
          alignment: 'center',
          pageBreak: 'before',
        },
        '\n',
        {
          image: `imgCanvasSegAnoms${i}`,
          width: this.widthImageAnomalia,
          alignment: 'center',
        },
        '\n',
        '\n',
        {
          columns: [
            {
              width: '*',
              text: '',
            },

            {
              width: 'auto',
              table: segTable,
            },

            {
              width: '*',
              text: '',
            },
          ],
        },

        '\n',

        {
          columns: [
            {
              width: '*',
              text: '',
            },
            {
              width: 'auto',
              table: {
                headerRows: 1,
                body: [anomsTable[0]].concat(anomsTable[1]),
              },
            },
            {
              width: '*',
              text: '',
            },
          ],
        },
      ];

      allPagsAnexo.push(pagAnexo);
    }

    return allPagsAnexo;
  }

  private getSeg1ejeTable() {
    const segBodyTableHeader = [
      {
        text: this.translation.t('Fecha/Hora'),
        style: 'tableHeaderImageData',
      },
      {
        text: this.translation.t('Temp. aire'),
        style: 'tableHeaderImageData',
      },
      {
        text: this.translation.t('Emisividad'),
        style: 'tableHeaderImageData',
      },
      {
        text: this.translation.t('Temp. reflejada'),
        style: 'tableHeaderImageData',
      },
      // {
      //   text: this.translation.t('Módulo'),
      //   style: 'tableHeaderImageData',
      // },
    ];

    const segBodyTableContent = [
      {
        text: this.datePipe.transform(this.selectedInforme.fecha * 1000, 'dd/MM/yyyy HH:mm:ss'),
        style: 'tableCellAnexo1',
        noWrap: true,
      },
      {
        text: this.selectedInforme.temperatura.toString().concat(' ºC'),
        style: 'tableCellAnexo1',
        noWrap: true,
      },
      {
        text: this.selectedInforme.emisividad,
        style: 'tableCellAnexo1',
        noWrap: true,
      },
      {
        text: this.selectedInforme.tempReflejada.toString().concat(' ºC'),
        style: 'tableCellAnexo1',
        noWrap: true,
      },
      // {
      //   text: this.writeModulo(anoms[0]),
      //   style: 'tableCellAnexo1',
      //   noWrap: true,
      // },
    ];

    const segTableBody = [segBodyTableHeader, segBodyTableContent];

    const segTable = {
      body: segTableBody,
    };

    if (this.selectedInforme.hasOwnProperty('irradiancia')) {
      segBodyTableHeader.push({
        text: this.translation.t('Irradiancia'),
        style: 'tableHeaderImageData',
      });
      segBodyTableContent.push({
        text: this.selectedInforme.irradiancia.toString().concat(' W/m2'),
        style: 'tableCellAnexo1',
        noWrap: true,
      });
    }
    if (this.selectedInforme.hasOwnProperty('viento')) {
      segBodyTableHeader.push({
        text: this.translation.t('Viento') + ' (Beaufort)',
        style: 'tableHeaderImageData',
      });
      segBodyTableContent.push({
        text: this.selectedInforme.viento,
        style: 'tableCellAnexo1',
        noWrap: true,
      });
    }
    if (this.selectedInforme.hasOwnProperty('vientoVelocidad')) {
      segBodyTableHeader.push({
        text: this.translation.t('Velocidad viento'),
        style: 'tableHeaderImageData',
      });
      segBodyTableContent.push({
        text: this.selectedInforme.vientoVelocidad.toString() + ' (Beaufort)',
        style: 'tableCellAnexo1',
        noWrap: true,
      });
    }
    if (this.selectedInforme.hasOwnProperty('vientoDireccion')) {
      segBodyTableHeader.push({
        text: this.translation.t('Dirección viento'),
        style: 'tableHeaderImageData',
      });
      segBodyTableContent.push({
        text: this.selectedInforme.vientoDireccion.toString() + 'º',
        style: 'tableCellAnexo1',
        noWrap: true,
      });
    }

    return segTable;
  }

  private globalCoordsLabel(globalCoords: string[]): string {
    const coords: string[] = [];
    globalCoords.forEach((coord, index) => {
      if (coord !== undefined && coord !== null && coord !== '') {
        coords.push(coord);
      }
    });
    let label = '';
    coords.forEach((coord, index) => {
      label = label + coord;
      if (index < coords.length - 1) {
        label = label + '.';
      }
    });

    return label;
  }

  private getPaginaSeguidor1EjeAnoms(anomalias: Anomalia[]) {
    // Header
    const cabecera = [];
    const columnasAnexoSeguidor = this.columnasAnomalia.filter((col) => {
      return !GLOBAL.columnasAnexoSeguidor.includes(col.nombre);
    });
    if (this.planta.hasOwnProperty('numerosSerie')) {
      if (this.planta.numerosSerie) {
        columnasAnexoSeguidor.push({ nombre: 'numeroSerie', descripcion: 'N/S' });
      }
    }

    cabecera.push({
      text: this.translation.t('Número'),
      style: 'tableHeaderBlue',
    });
    for (const col of columnasAnexoSeguidor) {
      cabecera.push({
        text: this.translation.t(this.getEncabezadoTablaSeguidor(col)),
        style: 'tableHeaderBlue',
      });
    }

    // Body
    const body = [];
    let contadorAnoms = 0;
    const totalAnomsSeguidor = anomalias.length;
    for (const anom of anomalias) {
      contadorAnoms += 1;
      const row = [];
      row.push({
        text: `${contadorAnoms}/${totalAnomsSeguidor}`,
        noWrap: true,
        style: 'tableCellAnexo1',
      });

      for (const col of columnasAnexoSeguidor) {
        row.push({
          text: this.translation.t(this.getTextoColumnaAnomalia(anom, col.nombre)),
          noWrap: true,
          style: 'tableCellAnexo1',
        });
      }
      body.push(row);
    }
    return [cabecera, body];
  }

  private getAnexoSegs1EjeNoAnoms(numAnexo: string) {
    const allPagsAnexo = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n ${this.translation.t('Anexo')} ${numAnexo}: ${this.translation.t(
        'Seguidores sin anomalías'
      )}`,
      style: 'h1',
      alignment: 'center',
      pageBreak: 'before',
    };

    allPagsAnexo.push(pag1Anexo);

    for (let i = 0; i < this.seguidores1ejeNoAnoms.length; i++) {
      const seg = this.seguidores1ejeNoAnoms[i];

      const segTable = this.getSeg1ejeTable();

      const pagAnexo = [
        {
          // text: `${this.translation.t('Seguidor')} ${this.globalCoordsLabel(seg.globalCoords)}`,
          text: `${i + 1}/${this.seguidores1ejeNoAnoms.length} - ${this.translation.t(
            'Seguidor'
          )} ${this.downloadReportService.getNombreS1E(this.seguidores1ejeNoAnoms[i])}`,
          style: 'h2',
          alignment: 'center',
          pageBreak: 'before',
        },
        '\n',
        {
          image: `imgCanvasSegNoAnoms${i}`,
          width: this.widthImageAnomalia,
          alignment: 'center',
        },
        '\n',
        '\n',
        {
          columns: [
            {
              width: '*',
              text: '',
            },

            {
              width: 'auto',
              table: segTable,
            },

            {
              width: '*',
              text: '',
            },
          ],
        },
      ];

      allPagsAnexo.push(pagAnexo);
    }

    return allPagsAnexo;
  }

  private getAnexoSeguidores(numAnexo: string) {
    const allPagsAnexo = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n ${this.translation.t('Anexo')} ${numAnexo}: ${this.translation.t(
        'Anomalías térmicas por seguidor'
      )}`,
      style: 'h1',
      alignment: 'center',
      pageBreak: 'before',
    };

    allPagsAnexo.push(pag1Anexo);

    for (const seg of this.seguidoresInforme) {
      const table = this.getPaginaSeguidor(seg);

      if (seg.anomaliasCliente.length > 0) {
        const pagAnexo = [
          {
            text: `${this.translation.t('Seguidor')} ${seg.nombre}`,
            style: 'h2',
            alignment: 'center',
            pageBreak: 'before',
          },

          '\n',

          {
            image: `imgCanvas${seg.nombre}`,
            width: this.widthImageSeguidor,
            alignment: 'center',
          },

          '\n',

          {
            columns: [
              {
                width: '*',
                text: '',
              },

              {
                width: 'auto',
                table: {
                  body: [
                    [
                      {
                        text: this.translation.t('Posición GPS'),
                        style: 'tableHeaderImageData',
                      },
                      {
                        text: this.translation.t('Fecha/Hora'),
                        style: 'tableHeaderImageData',
                      },

                      {
                        text: this.translation.t('Irradiancia'),
                        style: 'tableHeaderImageData',
                      },

                      {
                        text: this.translation.t('Temp. aire'),
                        style: 'tableHeaderImageData',
                      },

                      {
                        text: this.translation.t('Viento') + ' (Beaufort)',
                        style: 'tableHeaderImageData',
                      },

                      {
                        text: this.translation.t('Emisividad'),
                        style: 'tableHeaderImageData',
                      },

                      {
                        text: this.translation.t('Temp. reflejada'),
                        style: 'tableHeaderImageData',
                      },
                      {
                        text: this.translation.t('Módulo'),
                        style: 'tableHeaderImageData',
                      },
                    ],
                    [
                      {
                        text: 'link',
                        link: this.anomaliaInfoService.getGoogleMapsUrl(
                          this.olMapService.getCentroid(seg.featureCoords)
                        ),
                        style: 'linkCellAnexo1',
                        noWrap: true,
                      },
                      {
                        text: this.datePipe
                          .transform(this.selectedInforme.fecha * 1000, 'dd/MM/yyyy')
                          .concat(' ')
                          .concat(this.datePipe.transform(seg.anomaliasCliente[0].datetime * 1000, 'HH:mm:ss')),
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },

                      {
                        text: Math.round(seg.anomaliasCliente[0].irradiancia).toString().concat(' W/m2'),
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },
                      {
                        text: Math.round((seg.anomaliasCliente[0] as PcInterface).temperaturaAire)
                          .toString()
                          .concat(' ºC'),
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },

                      {
                        text: (seg.anomaliasCliente[0] as PcInterface).viento,
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },

                      {
                        text: (seg.anomaliasCliente[0] as PcInterface).emisividad,
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },

                      {
                        text: Math.round((seg.anomaliasCliente[0] as PcInterface).temperaturaReflejada)
                          .toString()
                          .concat(' ºC'),
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },

                      {
                        text: this.writeModulo(seg.anomaliasCliente[0]),
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },
                    ],
                  ],
                },
              },

              {
                width: '*',
                text: '',
              },
            ],
          },

          '\n',

          {
            columns: [
              {
                width: '*',
                text: '',
              },
              {
                width: 'auto',
                table: {
                  headerRows: 1,
                  body: [table[0]].concat(table[1]),
                },
              },
              {
                width: '*',
                text: '',
              },
            ],
          },
        ];

        allPagsAnexo.push(pagAnexo);
      }
    }

    return allPagsAnexo;
  }

  private getAnexoSeguidoresSinAnomalias(numAnexo: string) {
    const allPagsAnexo = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n ${this.translation.t('Anexo')} ${numAnexo}: ${this.translation.t(
        'Seguidores sin anomalías'
      )}`,
      style: 'h1',
      alignment: 'center',
      pageBreak: 'before',
    };

    allPagsAnexo.push(pag1Anexo);

    for (const seg of this.seguidoresInforme) {
      if (seg.anomaliasCliente.length === 0) {
        const pagAnexo = [
          {
            text: `${this.translation.t('Seguidor')} ${seg.nombre}`,
            style: 'h2',
            alignment: 'center',
            pageBreak: 'before',
          },

          '\n',

          {
            image: `imgCanvas${seg.nombre}`,
            width: this.widthImageSeguidor,
            alignment: 'center',
          },

          '\n',

          {
            columns: [
              {
                width: '*',
                text: '',
              },

              {
                width: 'auto',
                table: {
                  body: [
                    [
                      {
                        text: this.translation.t('Posición GPS'),
                        style: 'tableHeaderImageData',
                      },
                      {
                        text: this.translation.t('Fecha/Hora'),
                        style: 'tableHeaderImageData',
                      },

                      {
                        text: this.translation.t('Irradiancia'),
                        style: 'tableHeaderImageData',
                      },

                      {
                        text: this.translation.t('Temp. aire'),
                        style: 'tableHeaderImageData',
                      },

                      {
                        text: this.translation.t('Viento') + ' (Beaufort)',
                        style: 'tableHeaderImageData',
                      },

                      {
                        text: this.translation.t('Emisividad'),
                        style: 'tableHeaderImageData',
                      },

                      {
                        text: this.translation.t('Temp. reflejada'),
                        style: 'tableHeaderImageData',
                      },
                      {
                        text: this.translation.t('Módulo'),
                        style: 'tableHeaderImageData',
                      },
                    ],
                    [
                      {
                        text: 'link',
                        link: this.anomaliaInfoService.getGoogleMapsUrl(
                          this.olMapService.getCentroid(seg.featureCoords)
                        ),
                        style: 'linkCellAnexo1',
                        noWrap: true,
                      },
                      {
                        text: this.datePipe
                          .transform(this.selectedInforme.fecha * 1000, 'dd/MM/yyyy')
                          .concat(' ')
                          .concat(this.datePipe.transform(seg.anomalias[0].datetime * 1000, 'HH:mm:ss')),
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },

                      {
                        text: Math.round(seg.anomalias[0].irradiancia).toString().concat(' W/m2'),
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },
                      {
                        text: Math.round((seg.anomalias[0] as PcInterface).temperaturaAire)
                          .toString()
                          .concat(' ºC'),
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },

                      {
                        text: (seg.anomalias[0] as PcInterface).viento,
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },

                      {
                        text: (seg.anomalias[0] as PcInterface).emisividad,
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },

                      {
                        text: Math.round((seg.anomalias[0] as PcInterface).temperaturaReflejada)
                          .toString()
                          .concat(' ºC'),
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },

                      {
                        text: this.writeModulo(seg.anomalias[0]),
                        style: 'tableCellAnexo1',
                        noWrap: true,
                      },
                    ],
                  ],
                },
              },

              {
                width: '*',
                text: '',
              },
            ],
          },
        ];

        allPagsAnexo.push(pagAnexo);
      }
    }

    return allPagsAnexo;
  }

  writeModulo(anomalia: Anomalia) {
    if (!anomalia.hasOwnProperty('modulo')) {
      return '-';
    }
    const modulo = anomalia.modulo;
    let newRow = '';
    if (modulo !== null) {
      if (modulo.hasOwnProperty('marca')) {
        newRow = newRow.concat(modulo.marca.toString()).concat(' ');
      }
      if (modulo.hasOwnProperty('modelo')) {
        newRow = newRow.concat(modulo.modelo.toString()).concat(' ');
      }
      if (modulo.hasOwnProperty('potencia')) {
        newRow = newRow.concat('(').concat(modulo.potencia.toString()).concat(' W)');
      }
    }

    return newRow;
  }

  compareIrradiancia(a: Anomalia, b: Anomalia) {
    if (a.irradiancia < b.irradiancia) {
      return -1;
    }
    if (a.irradiancia > b.irradiancia) {
      return 1;
    }
    return 0;
  }

  private getTextoIrradiancia() {
    if (this.selectedInforme.irradiancia === 0) {
      return `${this.translation.t(
        'Los datos de irradiancia durante el vuelo han sido obtenidos de los instrumentos de medición el equipo ha llevado a planta, los cuales han sido suministrados a nuestro software para ser emparejados con las imágenes termográficas tomadas desde el aire, de manera que cada imagen tiene una irradiancia asociada. Dicha irradiancia es la más cercana en el tiempo de las registradas.'
      )}`;
    } else {
      return `${this.translation.t(
        'Los datos de irradiancia durante el vuelo han sido obtenidos de la estación meteorológica de la propia planta de'
      )} ${this.planta.nombre}, ${this.translation.t(
        'los cuales han sido suministrados a nuestro software para ser emparejados con las imágenes termográficas tomadas desde el aire, de manera que cada imagen tiene una irradiancia asociada. Dicha irradiancia es la más cercana en el tiempo de las registradas.'
      )}`;
    }
  }

  private capFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private calificacionMae(mae: number) {
    if (mae <= 1) {
      return this.translation.t('muy bueno');
    } else if (mae <= 2) {
      return this.translation.t('correcto');
    } else {
      return this.translation.t('mejorable');
    }
  }

  private getEncabezadoTablaSeguidor(columna: any) {
    if (columna.nombre === 'local_xy') {
      if (this.planta.hasOwnProperty('etiquetasLocalXY')) {
        return 'Nº Módulo';
      }
    }
    return this.translation.t(columna.descripcion);
  }

  private getGlobalCoordsLabel(anomalia: Anomalia) {
    let label = '';

    const globals = anomalia.globalCoords.filter((coord) => coord !== undefined && coord !== null && coord !== '');

    globals.forEach((coord, index) => {
      label += coord;

      if (index < globals.length - 1) {
        label += this.plantaService.getGlobalsConector(this.planta);
      }
    });

    return label;
  }

  //  ###################  CONTENIDO ##################################

  private getTextoColumnaAnomalia(anomalia: Anomalia, columnaNombre: string): string {
    if (columnaNombre === 'tipo') {
      return this.anomTipos[anomalia.tipo];
    } else if (columnaNombre === 'gradienteNormalizado' || columnaNombre === 'temperaturaMax') {
      return (Math.round(anomalia[columnaNombre] * 10) / 10).toString().concat(' ºC');
    } else if (columnaNombre === 'irradiancia') {
      return Math.round(anomalia.irradiancia).toString().concat(' W/m2');
    } else if (columnaNombre === 'datetimeString') {
      return this.datePipe
        .transform(this.selectedInforme.fecha * 1000, 'dd/MM/yyyy')
        .concat(' ')
        .concat(this.datePipe.transform(anomalia.datetime * 1000, 'HH:mm:ss'));
    } else if (columnaNombre === 'local_xy') {
      return this.downloadReportService.getPositionModulo(this.planta, anomalia).toString();
    } else if (columnaNombre === 'severidad') {
      return anomalia.clase.toString();
    } else if (columnaNombre === 'criticidad') {
      return this.labelsCriticidad[anomalia.criticidad];
    } else if (columnaNombre === 'local_id') {
      return this.getLocalId(anomalia);
    } else {
      return anomalia[columnaNombre];
    }
  }

  private getTablaCategoria() {
    const array = [];
    for (const i of this.numTipos) {
      if (this.countCategoria[i - 1] > 0) {
        array.push(
          new Array(
            {
              text: this.translation.t(GLOBAL.pcDescripcion[i]),
            },
            {
              text: this.countCategoria[i - 1],
            },
            {
              text:
                this.decimalPipe
                  .transform((this.countCategoria[i - 1] / this.anomaliasInforme.length) * 100, '1.0-1')
                  .toString() + ' %',
            }
          )
        );
      }
    }

    return array;
  }

  private getLocalId(anomalia: Anomalia): string {
    const localIdParts: string[] = [];
    anomalia.globalCoords.forEach((coord) => {
      if (coord !== undefined && coord !== null && coord !== '') {
        localIdParts.push(coord);
      }
    });
    if (anomalia.localX !== undefined && anomalia.localX !== null && anomalia.localX > 0) {
      localIdParts.push(anomalia.localX.toString());
    }
    if (anomalia.localY !== undefined && anomalia.localY !== null && anomalia.localY > 0) {
      localIdParts.push(this.downloadReportService.getAltura(this.planta, anomalia.localY).toString());
    }

    let localId = '';
    localIdParts.forEach((part, index, parts) => {
      localId += part;
      if (index < parts.length - 1) {
        localId += '.';
      }
    });

    if (localId === '') {
      localId = '-';
    }

    anomalia.localId = localId;

    return localId;
  }

  private getTablaPosicion() {
    const array = [];
    const arrayHeader = [];
    arrayHeader.push({});

    for (const i of this.arrayColumnas) {
      arrayHeader.push({
        text: i.toString(),
        style: 'tableHeaderBlue',
      });
    }

    array.push(arrayHeader);

    for (const j of this.arrayFilas) {
      const arrayFila = [];
      arrayFila.push({
        text: this.plantaService.getAltura(this.planta, j, this.alturaMax).toString(),
        style: 'tableHeaderBlue',
      });
      const countPosicionFila = this.countPosicion[j - 1];
      for (const i of this.arrayColumnas) {
        arrayFila.push({
          text: countPosicionFila[i - 1].toString(),
          style: 'tableCell',
        });
      }

      array.push(arrayFila);
    }

    return array;
  }

  private getTablaAltura() {
    const body = [];

    const anomsTabla = this.anomaliasInforme.filter((anom) => anom.clase !== 1);

    for (let i = 1; i <= this.alturaMax; i++) {
      const arrayFila = [];
      arrayFila.push({
        text: 'Fila ' + this.plantaService.getAltura(this.planta, i, this.alturaMax).toString(),
        style: 'tableHeaderBlue',
      });

      const countAnomalias = anomsTabla.filter((anom) => anom.localY === i).length;

      arrayFila.push({
        text: countAnomalias.toString(),
        style: 'tableCell',
      });

      let percentage = 0;
      if (countAnomalias > 0) {
        percentage = (countAnomalias / anomsTabla.length) * 100;
      }

      arrayFila.push({
        text: this.decimalPipe.transform(percentage, '1.0-2') + '%',
        style: 'tableCell',
      });

      body.push(arrayFila);
    }

    return body;
  }

  getPaginaSeguidor(seguidor: Seguidor) {
    // Header
    const cabecera = [];
    const columnasAnexoSeguidor = this.columnasAnomalia.filter((col) => {
      return !GLOBAL.columnasAnexoSeguidor.includes(col.nombre);
    });
    if (this.planta.hasOwnProperty('numerosSerie')) {
      if (this.planta.numerosSerie) {
        columnasAnexoSeguidor.push({ nombre: 'numeroSerie', descripcion: 'N/S' });
      }
    }

    cabecera.push({
      text: this.translation.t('Número'),
      style: 'tableHeaderBlue',
    });
    for (const col of columnasAnexoSeguidor) {
      cabecera.push({
        text: this.translation.t(this.getEncabezadoTablaSeguidor(col)),
        style: 'tableHeaderBlue',
      });
    }

    // Body
    const body = [];
    let contadorAnoms = 0;
    const totalAnomsSeguidor = seguidor.anomaliasCliente.length;
    for (const anom of seguidor.anomaliasCliente) {
      contadorAnoms += 1;
      const row = [];
      row.push({
        text: `${contadorAnoms}/${totalAnomsSeguidor}`,
        noWrap: true,
        style: 'tableCellAnexo1',
      });

      for (const col of columnasAnexoSeguidor) {
        row.push({
          text: this.translation.t(this.getTextoColumnaAnomalia(anom, col.nombre)),
          noWrap: true,
          style: 'tableCellAnexo1',
        });
      }
      body.push(row);
    }
    return [cabecera, body];
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    this.imageProcessService.resetService();
    this.imagesLoadService.resetService();
    this.imagesTilesService.resetService();
  }

  //////////////////////////////////////////////////////

  get countLoadedImages() {
    return this._countLoadedImages;
  }

  set countLoadedImages(value: number) {
    this._countLoadedImages = value;
    this.countLoadedImages$.next(value);
  }

  get countLoadedImagesSegs1EjeAnoms() {
    return this._countLoadedImagesSegs1EjeAnoms;
  }

  set countLoadedImagesSegs1EjeAnoms(value: number) {
    this._countLoadedImagesSegs1EjeAnoms = value;
    this.countLoadedImagesSegs1EjeAnoms$.next(value);
  }

  get countLoadedImagesSegs1EjeNoAnoms() {
    return this._countLoadedImagesSegs1EjeNoAnoms;
  }

  set countLoadedImagesSegs1EjeNoAnoms(value: number) {
    this._countLoadedImagesSegs1EjeNoAnoms = value;
    this.countLoadedImagesSegs1EjeNoAnoms$.next(value);
  }

  get columnasAnomalia() {
    return this._columnasAnomalia;
  }

  set columnasAnomalia(value: any[]) {
    this._columnasAnomalia = value;
    this.columnasAnomalia$.next(value);
  }

  get loadedImages() {
    return this._loadedImages;
  }

  set loadedImages(value: string) {
    this._loadedImages = value;
    this.loadedImages$.next(value);
  }

  get seguidoresInforme() {
    return this._seguidoresInforme;
  }

  set seguidoresInforme(value: Seguidor[]) {
    this._seguidoresInforme = value;
    this.seguidoresInforme$.next(value);
  }
}
