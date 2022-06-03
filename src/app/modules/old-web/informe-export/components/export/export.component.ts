import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GLOBAL } from '@data/constants/global';
import { DRONE } from '@data/constants/drone';

import { PcService, SeguidorInterface } from '@data/services/pc.service';

import { PcInterface } from '@core/models/pc';
import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

import 'fabric';
declare let fabric;
import { AngularFireStorage } from '@angular/fire/storage';
import { Observable, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatTableDataSource } from '@angular/material/table';

import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PlantaService } from '@data/services/planta.service';
import { InformeService } from '@data/services/informe.service';
import { Translation } from './translations';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

pdfMake.vfs = pdfFonts.pdfMake.vfs;
declare var $: any;

export interface PcsTable {
  tipo: string;
  coa1: number;
  coa2: number;
  coa3: number;
  total: number;
}

export interface Apartado {
  nombre: string;
  descripcion: string;
  orden: number;
  elegible: boolean;
  apt?: number;
}

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.css'],
  providers: [DecimalPipe, DatePipe],
})
export class ExportComponent implements OnInit {
  @ViewChild('content') content: ElementRef;

  public planta: PlantaInterface;
  public informe: InformeInterface;
  public lan: string;
  public lanSwitch: boolean;
  public titulo: string;
  public irradianciaMedia: number;
  public url: string;
  public dataTipos: any;
  public dataSeveridad: any;
  public numCategorias: number[];
  public numClases: number[];
  public countCategoria;
  public countPosicion;
  public countCategoriaClase;
  public countClase;
  public mae;
  public global;
  public irradianciaImg$: Observable<string | null>;
  public suciedadImg$: Observable<string | null>;
  public portadaImg$: Observable<string | null>;
  public logoImg$: Observable<string | null>;
  public arrayFilas: Array<number>;
  public arrayColumnas: Array<number>;
  public tempReflejada: number;
  public emisividad: number;
  public tipoInforme: string;
  public filteredSeguidores: SeguidorInterface[];
  public seguidor: SeguidorInterface;
  public pcColumnas: any[];
  public filtroColumnas: string[];
  public filtroApartados: string[];
  private filteredColumnasSource = new BehaviorSubject<any[]>(new Array<any>());
  public currentFilteredColumnas$ = this.filteredColumnasSource.asObservable();
  public currentFilteredColumnas: Array<any>;
  public pcDescripcion = GLOBAL.labels_tipos;
  public filteredSeguidores$: Observable<SeguidorInterface[]>;
  public filteredSeguidoresVistaPrevia: SeguidorInterface[];
  public filteredPcsVistaPrevia: PcInterface[];
  public filteredPcs$: Observable<PcInterface[]>;
  public filteredPcs: PcInterface[];
  public currentFiltroGradiente: number;
  public countLoadedImages: number;
  public countSeguidores: number;
  public generandoPDF = false;
  public isLocalhost: boolean;
  public imageList = {};
  public pages;
  public imgIrradianciaBase64: string;
  public imgPortadaBase64: string;
  public imgSuciedadBase64: string;
  public imgFormulaMaeBase64: string;
  public imgCurvaMaeBase64: string;
  public imgLogoBase64: string;
  public progresoPDF: string;
  public informeCalculado: boolean;
  public apartadosInforme: Apartado[];
  public displayedColumns: string[] = ['categoria', 'coa1', 'coa2', 'coa3', 'total'];
  public t: Translation;
  public dataSource: MatTableDataSource<PcsTable>;
  private countLoadedImages$ = new BehaviorSubject(null);
  widthLogo: number;
  widthLogoOriginal: number;
  widthSuciedad: number;
  widthCurvaMae: number;
  widthFormulaMae: number;
  widthPortada: number;
  widthIrradiancia: number;
  imgQuality: number;
  scaleImgLogoHeader: number;
  heightLogoHeader: number;
  jpgQuality: number;
  widthSeguidor: number;
  public hasUserArea: boolean;

  constructor(
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
    private storage: AngularFireStorage,
    private pcService: PcService,
    private plantaService: PlantaService,
    private informeService: InformeService
  ) {
    this.numCategorias = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);
    this.numClases = Array(GLOBAL.labels_clase.length)
      .fill(0)
      .map((_, i) => i + 1);

    this.global = GLOBAL;

    this.informeCalculado = false;
    this.lan = 'es';
    this.url = GLOBAL.url;
    this.titulo = 'Vista de informe';
    this.tipoInforme = '2';
    this.isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  }

  onSliderChange($event) {
    // $event = false: español   | True: english
    if ($event) {
      this.lan = 'en';
    } else {
      this.lan = 'es';
    }
  }

  ngOnInit() {
    this.planta = this.plantaService.get();
    this.informe = this.informeService.get();
    this.progresoPDF = '0';
    this.widthLogo = 200;
    this.widthPortada = 600; // =600 es el ancho de pagina completo
    this.widthSuciedad = 501;
    this.widthCurvaMae = 300;
    this.widthFormulaMae = 200;
    this.widthIrradiancia = 499;
    this.imgQuality = 3.5;
    this.heightLogoHeader = 40;
    this.jpgQuality = 0.95;
    this.widthSeguidor = 450;
    this.hasUserArea = false;

    this.plantaService.getUserAreas$(this.planta.id).subscribe((userAreas) => {
      if (userAreas.length > 0) {
        this.hasUserArea = true;
      }
    });

    this.filteredSeguidores$ = this.pcService.filteredSeguidores$;
    this.filteredPcs$ = this.pcService.currentFilteredPcs$;
    this.pcColumnas = this.getPcColumnas(this.planta);

    this.filtroColumnas = this.pcColumnas.map((element) => element.nombre);
    this.filteredColumnasSource.next(this.pcColumnas);

    this.currentFilteredColumnas$.subscribe((filteredCols) => {
      this.currentFilteredColumnas = filteredCols;
    });

    this.arrayFilas = Array(this.planta.filas)
      .fill(0)
      .map((_, i) => i + 1);
    this.arrayColumnas = Array(this.planta.columnas)
      .fill(0)
      .map((_, i) => i + 1);

    this.irradianciaImg$ = this.storage.ref(`informes/${this.informe.id}/irradiancia.png`).getDownloadURL();
    this.suciedadImg$ = this.storage.ref(`informes/${this.informe.id}/suciedad.jpg`).getDownloadURL();
    this.portadaImg$ = this.storage.ref(`informes/${this.informe.id}/portada.jpg`).getDownloadURL();
    this.logoImg$ = this.storage.ref(`empresas/${this.planta.empresa}/logo.jpg`).getDownloadURL();

    this.irradianciaImg$.pipe(take(1)).subscribe((url) => {
      fabric.util.loadImage(
        url,
        (img) => {
          const canvas = document.createElement('canvas');
          const width =
            this.widthIrradiancia * this.imgQuality > img.width ? img.width : this.widthIrradiancia * this.imgQuality;
          const scaleFactor = width / img.width;
          canvas.width = width;
          canvas.height = img.height * scaleFactor;
          const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
          this.imgIrradianciaBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
        },
        null,
        { crossOrigin: 'anonymous' }
      );
    });

    this.portadaImg$.pipe(take(1)).subscribe((url) => {
      fabric.util.loadImage(
        url,
        (img) => {
          const canvas = document.createElement('canvas');
          const width =
            this.widthPortada * this.imgQuality > img.width ? img.width : this.widthPortada * this.imgQuality;
          const scaleFactor = width / img.width;
          canvas.width = width;
          canvas.height = img.height * scaleFactor;
          const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
          this.imgPortadaBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
        },
        null,
        { crossOrigin: 'anonymous' }
      );
    });

    this.logoImg$.pipe(take(1)).subscribe((url) => {
      fabric.util.loadImage(
        url,
        (img) => {
          const canvas = document.createElement('canvas');
          const newWidth = this.widthLogo * this.imgQuality > img.width ? img.width : this.widthLogo * this.imgQuality;
          this.widthLogoOriginal = newWidth;
          const scaleFactor = newWidth / img.width;
          const newHeight = img.height * scaleFactor;
          canvas.width = newWidth;
          canvas.height = newHeight;
          this.scaleImgLogoHeader = this.heightLogoHeader / newHeight;
          const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          this.imgLogoBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
        },
        null,
        { crossOrigin: 'anonymous' }
      );
    });

    // Obtener pcs vista previa
    this.filteredPcs$.subscribe((pcs) => {
      this.filteredPcsVistaPrevia = pcs.slice(0, 20);
      this.filteredPcs = pcs;
      this.currentFiltroGradiente = this.pcService.currentFiltroGradiente;
      this.calcularInforme();
    });
    // Ordenar Pcs por seguidor:
    this.pcService.filteredSeguidores$.subscribe((seguidores) => {
      this.filteredSeguidores = seguidores;
      this.filteredSeguidoresVistaPrevia = seguidores.slice(0, 3);
    });

    this.suciedadImg$.pipe(take(1)).subscribe((url) => {
      fabric.util.loadImage(
        url,
        (img) => {
          const canvas = document.createElement('canvas');
          const width =
            this.widthIrradiancia * this.imgQuality > img.width ? img.width : this.widthIrradiancia * this.imgQuality;
          const scaleFactor = width / img.width;
          canvas.width = width;
          canvas.height = img.height * scaleFactor;
          const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
          this.imgSuciedadBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
        },
        null,
        { crossOrigin: 'anonymous' }
      );
    });

    fabric.util.loadImage(
      '../../../assets/images/maeCurva.png',
      (img) => {
        const canvas = document.createElement('canvas');
        const width =
          this.widthCurvaMae * this.imgQuality > img.width ? img.width : this.widthCurvaMae * this.imgQuality;
        const scaleFactor = width / img.width;
        canvas.width = width;
        canvas.height = img.height * scaleFactor;
        const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
        this.imgCurvaMaeBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
      },
      null,
      { crossOrigin: 'anonymous' }
    );

    fabric.util.loadImage(
      '../../../assets/images/formula_mae.png',
      (img) => {
        const canvas = document.createElement('canvas');
        const width =
          this.widthFormulaMae * this.imgQuality > img.width ? img.width : this.widthFormulaMae * this.imgQuality;
        const scaleFactor = width / img.width;
        canvas.width = width;
        canvas.height = img.height * scaleFactor;
        const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
        this.imgFormulaMaeBase64 = canvas.toDataURL('image/jpeg', this.jpgQuality);
      },
      null,
      { crossOrigin: 'anonymous' }
    );

    this.apartadosInforme = [
      {
        nombre: 'introduccion',
        descripcion: 'Introducción',
        orden: 1,
        apt: 1,
        elegible: false,
      },
      {
        nombre: 'criterios',
        descripcion: 'Criterios de operación',
        orden: 2,
        apt: 1,
        elegible: true,
      },
      {
        nombre: 'normalizacion',
        descripcion: 'Normalización de gradientes de temperatura',
        orden: 3,
        apt: 1,
        elegible: true,
      },
      {
        nombre: 'datosVuelo',
        descripcion: 'Datos del vuelo',
        orden: 4,
        apt: 1,
        elegible: true,
      },
      {
        nombre: 'irradiancia',
        descripcion: 'Irradiancia durante el vuelo',
        orden: 5,
        apt: 1,
        elegible: true,
      },
      {
        nombre: 'paramsTermicos',
        descripcion: 'Ajuste de parámetros térmicos',
        orden: 6,
        apt: 1,
        elegible: true,
      },
      {
        nombre: 'perdidaPR',
        descripcion: 'Pérdida de Performance Ratio',
        orden: 7,
        apt: 1,
        elegible: true,
      },
      {
        nombre: 'clasificacion',
        descripcion: 'Cómo se clasifican las anomalías',
        orden: 8,
        apt: 1,
        elegible: true,
      },
      {
        nombre: 'localizar',
        descripcion: 'Cómo localizar las anomalías',
        orden: 9,
        apt: 1,
        elegible: true,
      },
      {
        nombre: 'resultadosClase',
        descripcion: 'Resultados por clase',
        orden: 10,
        apt: 2,
        elegible: true,
      },
      {
        nombre: 'resultadosCategoria',
        descripcion: 'Resultados por categoría',
        orden: 11,
        apt: 2,
        elegible: true,
      },

      {
        nombre: 'resultadosMAE',
        descripcion: 'MAE de la planta',
        orden: 14,
        apt: 2,
        elegible: true,
      },
      {
        nombre: 'anexo1',
        descripcion: 'Anexo I: Listado resumen de anomalías térmicas',
        orden: 15,
        elegible: true,
      },
    ];
    if (this.planta.tipo === 'seguidores') {
      this.apartadosInforme.push(
        {
          nombre: 'anexo2',
          descripcion: 'Anexo II: Anomalías térmicas por seguidor',
          orden: 16,
          elegible: true,
        },
        {
          nombre: 'resultadosPosicion',
          descripcion: 'Resultados por posición',
          orden: 12,
          apt: 2,
          elegible: true,
        }
      );
      // const fecha_informe = new Date(this.informe.fecha * 1000);

      // if (fecha_informe.getFullYear() >= 2020) {
      //   this.apartadosInforme.push({
      //     nombre: 'anexo3',
      //     descripcion: 'Anexo III: Seguidores sin anomalías',
      //     orden: 17,
      //     elegible: true,
      //   });
      // }
    }
    if (this.planta.tipo === '1 eje') {
      this.apartadosInforme.push(
        {
          nombre: 'anexo2b',
          descripcion: 'Anexo II: Anomalías térmicas por seguidor',
          orden: 16,
          elegible: true,
        },
        {
          nombre: 'resultadosPosicionB',
          descripcion: 'Resultados por posición',
          orden: 12,
          apt: 2,
          elegible: true,
        },
        {
          nombre: 'resultadosSeguidor',
          descripcion: 'Resultados por seguidor',
          orden: 13,
          apt: 2,
          elegible: true,
        }
      );
    }

    this.apartadosInforme = this.apartadosInforme.sort((a: Apartado, b: Apartado) => {
      return a.orden - b.orden;
    });

    this.filtroApartados = this.apartadosInforme.map((element) => element.nombre);
  }

  getPcColumnas(planta: PlantaInterface): any[] {
    let pcColumnasTemp = GLOBAL.pcColumnas;

    const i = pcColumnasTemp.findIndex((e) => e.nombre === 'local_xy');
    pcColumnasTemp[i].descripcion = this.plantaService
      .getNombreLocalX(planta)
      .concat('/')
      .concat(this.plantaService.getNombreLocalY(planta));

    return pcColumnasTemp;
  }

  loadImage(width: number, url: string) {
    const canvas = document.createElement('canvas'); // Use Angular's Renderer2 method

    fabric.util.loadImage(
      url,
      (img) => {
        const scaleFactor = width / img.width;
        canvas.width = width;
        canvas.height = img.height * scaleFactor;
        const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
      },
      null,
      { crossOrigin: 'anonymous' }
    );
  }

  private calcularInforme() {
    this.t = new Translation(this.lan);
    this.countCategoria = Array();
    this.countCategoriaClase = Array();
    this.countClase = Array();
    this.countPosicion = Array();

    this.informeCalculado = false;
    const allPcs = this.filteredPcs;

    if (allPcs.length > 0) {
      this.irradianciaMedia = Math.round(
        allPcs.sort(this.compareIrradiancia)[Math.round(allPcs.length / 2)].irradiancia
      );
    } else {
      this.irradianciaMedia = 800;
    }

    this.emisividad = this.informe.emisividad;
    this.tempReflejada = this.informe.tempReflejada;

    // Calcular las alturas

    for (const y of this.arrayFilas) {
      const countColumnas = Array();
      for (const x of this.arrayColumnas) {
        if (this.planta.tipo === 'seguidores') {
          countColumnas.push(allPcs.filter((pc) => pc.local_x === x && pc.local_y === y).length);
        } else {
          countColumnas.push(allPcs.filter((pc) => pc.local_y === y).length);
        }
      }
      this.countPosicion.push(countColumnas);
    }

    // CATEGORIAS //
    let filtroCategoria;
    let filtroCategoriaClase;
    for (const cat of this.numCategorias) {
      filtroCategoria = allPcs.filter((pc) => pc.tipo === cat);
      this.countCategoria.push(filtroCategoria.length);

      let count1 = Array();
      for (const clas of this.numClases) {
        filtroCategoriaClase = allPcs.filter((pc) => this.pcService.getPcCoA(pc) === clas && pc.tipo === cat);
        count1.push(filtroCategoriaClase.length);
      }
      const totalPcsInFilter = count1[0] + count1[1] + count1[2];
      if (totalPcsInFilter > 0) {
        this.countCategoriaClase.push({
          categoria: this.pcDescripcion[cat],
          coa1: count1[0],
          coa2: count1[1],
          coa3: count1[2],
          total: totalPcsInFilter,
        });
      }
    }

    // CLASES //
    let filtroClase;
    for (const j of this.numClases) {
      filtroClase = allPcs.filter((pc) => this.pcService.getPcCoA(pc) === j);

      this.countClase.push(filtroClase.length);
    }

    this.informeCalculado = true;
    this.dataSource = new MatTableDataSource(this.countCategoriaClase);
  }

  public calificacionMae(mae: number) {
    if (mae <= 0.1) {
      return this.t.t('muy bueno');
    } else if (mae <= 0.2) {
      return this.t.t('correcto');
    } else {
      return this.t.t('mejorable');
    }
  }

  sortByLocalId(a: PcInterface, b: PcInterface) {
    return a.local_id - b.local_id;
  }

  compareIrradiancia(a: PcInterface, b: PcInterface) {
    if (a.irradiancia < b.irradiancia) {
      return -1;
    }
    if (a.irradiancia > b.irradiancia) {
      return 1;
    }
    return 0;
  }
  public capFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  public downloadPDF() {
    this.generandoPDF = true;
    this.countLoadedImages$ = new BehaviorSubject(null);

    const imageListBase64 = {};
    this.countLoadedImages = 0;
    this.countSeguidores = 1;

    if (this.filtroApartados.includes('anexo2')) {
      this.countLoadedImages$.subscribe((nombreSeguidor) => {
        if (nombreSeguidor !== null) {
          const canvas = $(`canvas[id="imgSeguidorCanvas${nombreSeguidor}"]`)[0] as HTMLCanvasElement;
          imageListBase64[`imgSeguidorCanvas${nombreSeguidor}`] = canvas.toDataURL('image/jpeg', this.jpgQuality);
          this.progresoPDF = this.decimalPipe.transform((100 * this.countLoadedImages) / this.countSeguidores, '1.0-0');

          // Cuando se carguen todas las imágenes
          if (this.countLoadedImages === this.countSeguidores) {
            this.pcService.currentFilteredPcs$.pipe(take(1)).subscribe((filteredPcs) => {
              this.filteredPcs = filteredPcs.sort(this.pcService.sortByGlobals);

              this.calcularInforme();

              pdfMake
                .createPdf(this.getDocDefinition(imageListBase64))
                .download(this.informe.prefijo.concat('informe'));

              this.generandoPDF = false;
            });
          }
        }
      });
    } else {
      this.pcService.currentFilteredPcs$.pipe(take(1)).subscribe((filteredPcs) => {
        this.filteredPcs = filteredPcs.sort(this.pcService.sortByLocalId);

        this.calcularInforme();

        pdfMake
          .createPdf(this.getDocDefinition(imageListBase64))
          .download(this.informe.prefijo.concat('informe'), () => {
            this.generandoPDF = false;
          });
      });
    }

    // Generar imagenes
    if (this.filtroApartados.includes('anexo2')) {
      this.countSeguidores = 0;
      for (const seguidor of this.filteredSeguidores) {
        this.setImgSeguidorCanvas(seguidor, false);
        this.countSeguidores++;
      }
    }
  }

  private onlyUnique(pcs: PcInterface[]): PcInterface[] {
    const archivosList = pcs.map((v, i, a) => {
      return v.archivo;
    });

    const archivosListUnique = archivosList.filter((v, i, s) => {
      return s.indexOf(v) === i;
    });

    const archivosListUniqueIndex = archivosList.map((v, i, s) => {
      return s.indexOf(v);
    });

    return pcs.filter((v, i, s) => {
      return archivosListUniqueIndex.includes(i);
    });
  }

  private setImgSeguidorCanvas(seguidor: SeguidorInterface, vistaPrevia: boolean = false) {
    const uniquePcs = this.onlyUnique(seguidor.pcs);
    const maxImagesPerPage = 2;
    const numImagesSeguidor = uniquePcs.length;
    const separacionImagenes = 2; //en pixeles

    const scale = Math.max(1 / numImagesSeguidor, 0.5);

    const canvas = new fabric.Canvas(`imgSeguidorCanvas${this.plantaService.getNombreSeguidor(seguidor.pcs[0])}`);
    canvas.height = canvas.height + separacionImagenes;
    canvas.backgroundColor = 'white';

    const imagesWidth = GLOBAL.resolucionCamara[1] / Math.min(maxImagesPerPage, numImagesSeguidor);
    const left0 = GLOBAL.resolucionCamara[1] / 2 - imagesWidth / 2;
    let loadedImages = 0;

    uniquePcs.forEach((pc, index, array) => {
      index++; // index empieza en 0. Le sumamos 1 para que empiece en 1.
      if (index <= maxImagesPerPage) {
        const pcs = seguidor.pcs.filter((value) => {
          return value.archivo === pc.archivo;
        });
        this.storage
          .ref(`informes/${this.informe.id}/jpg/${pc.archivoPublico}`)
          .getDownloadURL()
          .pipe(take(1))
          .subscribe((url) => {
            fabric.Image.fromURL(
              url,
              (img) => {
                loadedImages++;
                const top0 = (index - 1) * (GLOBAL.resolucionCamara[0] / numImagesSeguidor + separacionImagenes);

                img.set({
                  top: top0,
                  left: left0,
                  // width :  GLOBAL.resolucionCamara[0] * scale,
                  // height : GLOBAL.resolucionCamara[1] * scale,
                  scaleX: scale,
                  scaleY: scale,
                });
                //i create an extra var for to change some image properties
                canvas.add(img);
                this.drawAllPcsInCanvas(pcs, canvas, vistaPrevia, scale, top0, left0);

                if (!vistaPrevia && loadedImages === Math.min(numImagesSeguidor, maxImagesPerPage)) {
                  this.countLoadedImages++;
                  this.countLoadedImages$.next(seguidor.nombre);
                }
              },
              { crossOrigin: 'Anonymous' }
            );
          });
      }
    });
  }

  private drawAllPcsInCanvas(pcs: PcInterface[], canvas, vistaPrevia: boolean = false, scale = 1, top0 = 0, left0 = 0) {
    pcs.forEach((pc, i, a) => {
      this.drawPc(pc, canvas, scale, top0, left0);
      this.drawTriangle(pc, canvas, scale, top0, left0);
    });
  }

  private drawPc(pc: PcInterface, canvas: any, scale = 1, top0 = 0, left0 = 0) {
    const actObj1 = new fabric.Rect({
      left: pc.img_left * scale + left0,
      top: pc.img_top * scale + top0,
      fill: 'rgba(0,0,0,0)',
      stroke: 'black',
      strokeWidth: 1 * scale,
      width: pc.img_width * scale,
      height: pc.img_height * scale,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      localId: pc.local_id,
      ref: false,
      selectable: false,
      hoverCursor: 'default',
    });
    const actObj2 = new fabric.Rect({
      left: pc.img_left * scale - 1 + left0,
      top: pc.img_top * scale - 1 + top0,
      fill: 'rgba(0,0,0,0)',
      stroke: 'red',
      strokeWidth: 1,
      width: pc.img_width * scale + 2,
      height: pc.img_height * scale + 2,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      localId: pc.local_id,
      ref: false,
      hoverCursor: 'pointer',
      selectable: true,
    });
    const textId = new fabric.Text('#'.concat(pc.local_id.toString().concat(' ')), {
      left: pc.img_left * scale + left0,
      top: (pc.img_top - 26) * scale + top0,
      fontSize: 20 * scale,
      // textBackgroundColor: 'red',
      ref: 'text',
      selectable: false,
      hoverCursor: 'default',
      fill: 'white',
    });

    canvas.add(actObj1);
    canvas.add(actObj2);
    canvas.add(textId);
    canvas.renderAll();
  }

  private drawTriangle(pc: PcInterface, canvas: any, scale = 1, top0 = 0, left0 = 0) {
    const x = pc.img_x * scale;
    const y = pc.img_y * scale;

    const squareBase = 12 * scale;
    const triangle = new fabric.Triangle({
      width: squareBase,
      height: squareBase,
      fill: 'red',
      stroke: 'black',
      left: Math.round(x - squareBase / 2) + left0,
      top: y + top0, // si no ponemos este 2, entonces no lee bien debajo del triangulo
      selectable: false,
      ref: 'triangle',
      hoverCursor: 'default',
    });

    // const textTriangle = new fabric.Text(
    //   ' + '.concat(pc.gradienteNormalizado.toString().concat(' ºC ')),
    //   {
    //     left: pc.img_left * scale,
    //     top: (pc.img_top + pc.img_height + 5)  * scale,
    //     fontSize: 22 * scale,
    //     textBackgroundColor: 'white',
    //     ref: 'text',
    //     selectable: false,
    //     hoverCursor: 'default',
    //     fill: 'red'
    //   }
    // );

    canvas.add(triangle);
    // canvas.add(textTriangle);
    canvas.renderAll();
  }

  onCheckBoxColumnaChange($event: MatCheckboxChange) {
    const columnaChecked = $event.source.value;
    this.filtroColumnas = this.filtroColumnas.filter((nombre) => nombre !== columnaChecked);
    if ($event.checked === true) {
      this.filtroColumnas.push(columnaChecked);
    }

    // Llamar al behaviourObject
    this.filteredColumnasSource.next(this.pcColumnas.filter((e) => this.filtroColumnas.includes(e.nombre)));
  }
  onCheckBoxApartadosChange($event: MatCheckboxChange) {
    const apartadoChecked = $event.source.value;
    this.filtroApartados = this.filtroApartados.filter((nombre) => nombre !== apartadoChecked);
    if ($event.checked === true) {
      this.filtroApartados.push(apartadoChecked);
    }
  }

  onClickTipoInforme() {
    if (this.tipoInforme === '2') {
      // let count = 0;
      for (const seguidor of this.filteredSeguidoresVistaPrevia) {
        this.setImgSeguidorCanvas(seguidor, true);
        // count = count + 1;
        // if ( count === 5 ) {
        //   break;
        // }
      }
    }
  }

  //  ###################  CONTENIDO ##################################

  private getTablaCategoria() {
    const array = [];
    for (const i of this.numCategorias) {
      if (this.countCategoria[i - 1] > 0) {
        array.push(
          new Array(
            {
              text: this.t.t(this.global.pcDescripcion[i]),
            },
            {
              text: this.countCategoria[i - 1],
            },
            {
              text:
                this.decimalPipe
                  .transform((this.countCategoria[i - 1] / this.filteredPcs.length) * 100, '1.0-1')
                  .toString() + ' %',
            }
          )
        );
      }
    }

    return array;
  }

  private getTablaPosicion = function () {
    const array = [];
    const arrayHeader = [];
    arrayHeader.push({});

    for (const i of this.arrayColumnas) {
      arrayHeader.push({
        text: i.toString(),
        style: 'tableHeaderRed',
      });
    }

    array.push(arrayHeader);

    for (const j of this.arrayFilas) {
      const arrayFila = [];
      arrayFila.push({
        text: this.anomaliaInfoService.getAltura(j, this.planta).toString(),
        style: 'tableHeaderRed',
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
  };

  private getTextoIrradiancia() {
    if (this.informe.irradiancia === 0) {
      return `${this.t.t(
        'Los datos de irradiancia durante el vuelo han sido obtenidos de los instrumentos de medición el equipo ha llevado a planta, los cuales han sido suministrados a nuestro software para ser emparejados con las imágenes termográficas tomadas desde el aire, de manera que cada imagen tiene una irradiancia asociada. Dicha irradiancia es la más cercana en el tiempo de las registradas.'
      )}`;
    } else {
      return `${this.t.t(
        'Los datos de irradiancia durante el vuelo han sido obtenidos de la estación meteorológica de la propia planta de'
      )} ${this.planta.nombre}, ${this.t.t(
        'los cuales han sido suministrados a nuestro software para ser emparejados con las imágenes termográficas tomadas desde el aire, de manera que cada imagen tiene una irradiancia asociada. Dicha irradiancia es la más cercana en el tiempo de las registradas.'
      )}`;
    }
  }

  private getTextoLocalizar() {
    if (this.planta.tipo === 'seguidores') {
      return `${this.t.t('Además todos ellos tienen asociado los parámetros')} '${this.t.t(
        this.plantaService.getNombreGlobalX(this.planta)
      )}', '${this.t.t(this.plantaService.getNombreLocalX(this.planta))}' ${this.t.t('y')} '${this.t.t(
        this.plantaService.getNombreLocalY(this.planta)
      )}' ${this.t.t('según el mapa habitual de la planta')}.`;
    } else {
      return `${this.t.t('Además todos ellos tienen asociado los parámetros')} '${this.t.t(
        this.plantaService.getNombreGlobalX(this.planta)
      )}', '${this.t.t(this.plantaService.getNombreGlobalY(this.planta))}', '${this.t.t(
        this.plantaService.getNombreLocalX(this.planta)
      )}' ${this.t.t('y')} '${this.t.t(this.plantaService.getNombreLocalY(this.planta))}' ${this.t.t(
        'según el mapa habitual de la planta'
      )}.`;
    }
  }

  getPagesPDF() {
    // PORTADA //
    const portada: any[] = [
      {
        text: this.t.t('Análisis termográfico aéreo de módulos fotovoltaicos'),
        style: 'h1',
        alignment: 'center',
      },

      '\n',

      {
        image: this.imgPortadaBase64,
        width: this.widthPortada,
        alignment: 'center',
      },

      '\n',

      {
        text: [
          {
            text: this.t.t(`Planta solar:`),
            style: 'bold',
          },
          ' ',
          `${this.planta.nombre} (${this.planta.potencia} MW - ${this.t.t(this.planta.tipo)})`,
        ],
        style: 'subtitulo',
      },

      {
        text: [
          {
            text: this.t.t(`Fecha del vuelo:`),
            style: 'bold',
          },
          ' ',
          this.datePipe.transform(this.informe.fecha * 1000, 'dd/MM/yyyy'),
        ],
        style: 'subtitulo',
      },

      '\n\n',

      {
        image: this.imgLogoBase64,
        width: this.widthLogo,
        alignment: 'center',
        pageBreak: 'after',
      },
    ];

    const introduccion = (index: string) => {
      return [
        {
          text: `${this.t.t(
            'Este documento contiene los resultados de la inspección termográfica realizada en la planta solar fotovoltaica de'
          )} ${this.planta.nombre} (${this.planta.potencia} MW - ${this.t.t(this.planta.tipo)}).`,
          style: 'p',
        },

        '\n',

        {
          text: this.t.t(
            'Las inspecciones termográficas en instalaciones solares fotovoltaicas forman parte del mantenimiento preventivo recomendado para este tipo de instalaciones y tienen como objetivo anticiparse a aquellos problemas en los paneles que no son detectables fácilmente de otra manera.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.t.t(
            'Es importante que este mantenimiento sea llevado a cabo por profesionales, ya que una termografía mal realizada durante varios años puede afectar al estado general de la planta.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.t.t(
            'Entre las ventajas de realizar termografía infrarroja de manera regular: permite aumentar la eficiencia de la planta (performance ratio) en el medio plazo, evitar reparaciones más costosas, aumentar la vida útil de los equipos, detectar problemas relacionados con distintos fabricantes de paneles, problemas de conexión entre módulos, problemas relacionados con la vegetación o la suciedad en los módulos... entre una larga lista de ventajas.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: `${this.t.t(
            'La inspección ha sido realizada mediante vehículos aéreos no tripulados operados y diseñados a tal efecto'
          )} ${
            this.plantaService.getReferenciaSolardrone(this.planta) ? ` ${this.t.t('por')} Solardrone. ` : '. '
          } ${this.t.t(
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
          text: `${index} - ${this.t.t('Criterios de operación')}`,
          style: 'h3',
        },

        '\n',

        {
          text: `${this.t.t('El criterio base que')} ${
            this.plantaService.getReferenciaSolardrone(this.planta) ? ' Solardrone' : this.t.t(' se')
          } ${this.t.t(
            'ha seguido para realizar esta inspección termográfica es la norma internacional para inspecciones termográficas IEC 62446-3. En la misma se define cómo deben realizarse las termografías infrarrojas de módulos fotovoltaicos en plantas durante su operación'
          )}`,
          style: 'p',
        },

        '\n',

        {
          text: this.t.t('Hay dos niveles de inspección termográfica según la norma IEC 62446-3:'),
          style: 'p',
        },

        '\n',

        {
          ul: [
            {
              text: [
                {
                  text: this.t.t('Inspección simplificada'),
                  bold: true,
                },
                `: ${this.t.t(
                  'Esta es una inspección limitada para verificar que los módulos están funcionando, con requisitos reducidos para el personal. Este tipo de inspecciones se usan, por ejemplo, durante una puesta en marcha básica de una planta fotovoltaica'
                )}.\n\n`,
              ],
              style: 'p',
            },
            {
              text: [
                {
                  text: this.t.t('Inspección detallada'),
                  bold: true,
                },
                `: ${this.t.t(
                  'Requiere una comprensión más profunda de las anomalías térmicas. Puede ser utilizado para inspecciones periódicas de acuerdo con a la serie IEC 62446 y para solucionar problemas en sistemas con un bajo rendimiento. Se realizan mediciones de temperatura absoluta. Un experto autorizado en plantas fotovoltaicas, junto con exportos termógrafos, pueden llevar a cabo este tipo de inspecciones'
                )} .`,
              ],
              style: 'p',
            },
          ],
        },

        '\n',

        {
          text: this.t.t(
            'La termografía realizada entra dentro de las inspecciones detalladas indicadas por la norma, cumpliendo con los requisitos que indica la misma, que son:'
          ),
          style: 'p',
        },

        '\n',

        {
          ul: [
            {
              text: this.t.t('Medición absoluta de temperaturas: con un error menor de 2 ºC.'),
              style: 'p',
            },
            {
              text: this.t.t('Medición de temperatura máxima, media y gradiente.'),
              style: 'p',
            },
            {
              text: this.t.t(
                'Informe realizado por un experto en termografía infrarroja en conjunto con un experto en fotovoltaica.'
              ),
              style: 'p',
            },
            {
              text: this.t.t('Recomendación para cada tipo de anomalía registrada.'),
              style: 'p',
            },
            {
              text: this.t.t('Resolución geométrica térmica: 5x5 pixels por cada célula fotovoltaica.'),
              style: 'p',
            },
            {
              text: this.t.t('Resolución geométrica visual: 25x25 pixels por cada célula fotovoltaica.'),
              style: 'p',
            },
            {
              text: this.t.t(
                'Condiciones ambientales correctas: temperatura ambiente, viento, nubosidad e irradiancia.'
              ),
              style: 'p',
            },
            {
              text: this.t.t('Calibración de los equipos: cada 2 años.'),
              style: 'p',
            },
            {
              text: this.t.t(
                'Parámetros térmicos: el ajuste de la emisividad y la temperatura reflejada es imprescindible para una correcta medición de las temperaturas. Es necesario hacer las mediciones oportunas en campo para poder obtener estos parámetros, ya que dependen de la atmósfera, la meteorología, la suciedad en los módulos el día del vuelo y de los materiales del propio módulo.'
              ),
              style: 'p',
            },
            {
              text: this.t.t(
                'Documentación: el entregable incluye las imágenes radiométricas y visuales originales junto con todos los datos que requiere la norma.'
              ),
              style: 'p',
            },
            {
              text: this.t.t('Trayectoria: que asegure el cumplimiento de la norma.'),
              style: 'p',
            },
            {
              text: this.t.t('Velocidad: 10 km/h máximo.'),
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
          text: `${index} - ${this.t.t('Normalización de gradientes de temperatura')}`,
          style: 'h3',
        },

        '\n',

        {
          text: [
            this.t.t('Con el fin de poder ver la '),
            {
              text: this.t.t('evolución de las anomalías térmicas con el tiempo'),
              style: 'bold',
            },
            ' ',
            this.t.t(
              'comparando inspecciones termográficas llevadas a cabo en distintos meses o años (con condiciones ambientales distintas), es necesario contar con un procedimiento que permita normalizar los gradientes de temperatura.'
            ),
          ],
          style: 'p',
        },

        '\n',

        {
          text: this.t.t(
            "Por este motivo todas las anomalías registradas tienen asociada su 'gradiente normalizado', que es el gradiente de temperatura equivalente a haber realizado la inspección con una irradiancia de 1000 W/m2. Esto permitirá poder comparar los resultados de la presente inspección con otras futuras realizadas en condiciones ambientales diferentes y así poder tener una evolución fidedigna de cada una de las anomalías."
          ),
          style: 'p',
        },

        '\n\n',
      ];
    };

    const datosVuelo = (index: string) => {
      return [
        {
          text: `${index} - ${this.t.t('Datos del vuelo')}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.t.t('Las condiciones durante le vuelo han sido las siguientes:'),
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
                      text: this.t.t('Vehículo aéreo no tripulado'),
                      style: 'tableHeaderRed',
                      colSpan: 2,
                      alignment: 'center',
                    },
                    {},
                  ],
                  [
                    {
                      text: this.t.t('Aeronave'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${DRONE.model}`,
                    },
                  ],
                  [
                    {
                      text: this.t.t('Cámara térmica'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${DRONE.camaraTermica}`,
                    },
                  ],
                  [
                    {
                      text: this.t.t('Última calibración'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${DRONE.ultimaCalibracion}`,
                    },
                  ],

                  [
                    {
                      text: this.t.t('Datos del vuelo'),
                      style: 'tableHeaderRed',
                      colSpan: 2,
                      alignment: 'center',
                    },
                    {},
                  ],

                  [
                    {
                      text: this.t.t('Fecha'),
                      style: 'tableLeft',
                    },
                    {
                      text: this.datePipe.transform(this.informe.fecha * 1000, 'dd/MM/yyyy'),
                    },
                  ],

                  [
                    {
                      text: this.t.t('Horario de los vuelos'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.informe.hora_inicio} - ${this.informe.hora_fin}`,
                    },
                  ],

                  [
                    {
                      text: this.t.t('Velocidad'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.informe.velocidad} km/h`,
                    },
                  ],

                  [
                    {
                      text: this.t.t('GSD térmico (medio)'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.informe.gsd} cm/pixel (+- 0.5cm/pixel)`,
                    },
                  ],

                  [
                    {
                      text: this.t.t('GSD visual'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${Math.round(this.informe.gsd * 0.16 * 100) / 100} cm/pixel`,
                    },
                  ],

                  [
                    {
                      text: this.t.t('Datos meteorológicos'),
                      style: 'tableHeaderRed',
                      colSpan: 2,
                      alignment: 'center',
                    },
                    {},
                  ],

                  [
                    {
                      text: this.t.t('Irradiancia (media)'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.irradianciaMedia} W/m2`,
                    },
                  ],

                  [
                    {
                      text: this.t.t('Temperatura del aire'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.informe.temperatura} ºC`,
                    },
                  ],

                  [
                    {
                      text: this.t.t('Nubosidad'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.informe.nubosidad}/8 ${this.t.t('octavas')}`,
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

    const irradiancia = (index: string) => {
      return [
        {
          text: `${index} - ${this.t.t('Irradiancia durante el vuelo')}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.getTextoIrradiancia(),
          style: 'p',
        },

        '\n',

        {
          image: this.imgIrradianciaBase64,
          width: this.widthIrradiancia,
          alignment: 'center',
        },

        '\n\n',
      ];
    };

    const paramsTermicos = (index: string) => {
      return [
        {
          text: `${index} - ${this.t.t('Ajuste de parámetros térmicos')}`,
          style: 'h3',
        },

        '\n',

        {
          text: [
            this.t.t(
              'Con el fin de obtener medidas de temperaturas absolutas fiables, es necesario tener en cuenta distintas variables térmicas que afectan directamente al resultado de las medidas obtenidas por las cámaras. Las más importantes son'
            ),
            ' ',
            {
              text: this.t.t('la emisividad'),
              style: 'bold',
            },
            ' ',
            this.t.t('y la'),
            ,
            ' ',
            {
              text: this.t.t('temperatura reflejada'),
              style: 'bold',
            },
            '.',
          ],
          style: 'p',
        },

        '\n',

        {
          text: `${index}.1 - ${this.t.t('Emisividad')}`,
          style: 'h4',
        },

        '\n',

        {
          text: this.t.t(
            'La emisividad del material se mide de manera experimental en campo y depende del tipo de vidrio de los módulos y de la suciedad que presenten el día del vuelo. La emisividad escogida por el termógrafo tras el ensayo experimental es la siguiente:'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.t.t('Emisividad') + '  = ' + this.informe.emisividad.toString(),
          style: 'param',
        },

        '\n',

        // Imagen suciedad
        {
          image: this.imgSuciedadBase64,
          width: this.widthSuciedad,
          alignment: 'center',
        },

        '\n\n',

        {
          text: `${index}.2 - ${this.capFirstLetter(this.t.t('temperatura reflejada'))}`,
          style: 'h4',
        },

        '\n',

        {
          text: this.t.t(
            'La temperatura reflejada nos depende de la atmosfera y las condiciones meteorológicas del día del vuelo. Para obtener este parámetro es necesario llevar a cabo un procedimiento de medición adecuado en la misma planta el mismo día del vuelo. La temperatura reflejada medida es:'
          ),
          style: 'p',
        },

        '\n',

        {
          text:
            this.capFirstLetter(this.t.t('temperatura reflejada')) +
            ' = ' +
            this.informe.tempReflejada.toString() +
            ' ºC',
          style: 'param',
        },

        '\n\n',
      ];
    };

    const perdidaPR = (index: string) => {
      return [
        {
          text: `${index} - ${this.t.t('Pérdida de Performance Ratio')} (ΔPR)`,
          style: 'h3',
        },

        '\n',

        {
          text:
            this.t.t(
              'El coeficiente de rendimiento de sistemas fotovoltaicos o Performance Ratio es un parámetro que tuvo su origen conceptual en la norma IES 61724 (1998) para ser utilizado como indicador de calidad en la evaluación de sistemas fotovoltaicos'
            ) + '.\n\n',
          style: 'p',
        },

        {
          text: this.t.t(
            'Este parámetro se utiliza para medir el rendimiento de cualquier sistema fotovoltaico. En otras palabras, si queremos saber si un módulo está generando la energía que debería bastaría con conocer su PR. No podemos conocer el PR de cada módulo con una termografía, pero lo que sí podemos conocer es la pérdida de PR (ΔPR) producida por anomalía térmica respecto a sus condiciones ideales. Es decir, un módulo con un punto caliente que causa una ΔPR = -1% tiene menos importancia que una anomalía que causa una ΔPR = -33%, el cual está haciendo caer la producción eléctrica del módulo en un 33%.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.t.t(
            'La pérdida de PR nos indica, por tanto, lo perjudicial que es una anomalía térmica, identificando explícitamente los puntos sobre los que se debe actuar para optimizar la producción eléctrica. Es un parámetro indispensable en el diagnóstico termográfico de una instalación fotovoltaica, ya que nos permite tomar decisiones en base a un dato técnico-económico objetivo.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.t.t('Para poder evaluar la planta utilizaremos los siguientes dos sencillos conceptos:'),
          style: 'p',
        },

        '\n',

        {
          text: `${index}.1 - ${this.t.t('Pérdidas de performance ratio')} (ΔPR)`,
          style: 'h4',
        },

        '\n',

        {
          text: this.t.t(
            'Cada incidencia tiene una variación de performance ratio asociado. Por ejemplo, un diodo bypass en circuito abierto produce que el módulo trabaje al 15% de eficiencia en un caso típico (ΔPR=85%), mientras que una célula caliente aislada produce de media < 1% de pérdidas.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: `${index}.2 - ${this.t.t('Módulos apagados equivalentes')}`,
          style: 'h4',
        },

        '\n',

        {
          text: this.t.t(
            "El concepto 'módulos apagados equivalentes' es la cantidad equivalente de módulos que no generan energía debido a las incidencias registradas en la planta. Por ejemplo, si tenemos tres módulos idénticos con un defecto en un diodo bypass cada uno, cada módulo genera un 33% menos de energía. Entonces, el número de módulos apagados equivalentes es 1."
          ),
          style: 'p',
        },

        {
          text: this.t.t(
            'Uniendo los dos conceptos anteriores, se puede hacer una estimación “grosso modo” de la variación de PR de la planta de la siguiente manera:'
          ),
          style: 'p',
        },

        {
          image: this.imgFormulaMaeBase64,
          width: this.widthFormulaMae,
          alignment: 'center',
        },

        {
          text: this.t.t(
            'Siendo N = Número de módulos; PR = Performance ratio; MAE = Módulos apagados equivalente calculados'
          ),
          style: 'pieFoto',
        },

        '\n\n',

        {
          text: this.t.t(
            'Por lo tanto, sabiendo el MAE sabremos cuánto PR estamos perdiendo debido a las incidencias encontradas.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.t.t(
            'El objetivo será obtener un MAE bajo, lo cual nos indicará un correcto mantenimiento de la planta.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: `${this.t.t('Teniendo en cuenta todas las plantas fotovoltaicas inspeccionadas')}  ${
            this.plantaService.getReferenciaSolardrone(this.planta) ? ` ${this.t.t('por')} Solardrone,` : ','
          } ${this.t.t(
            "se puede hacer una clasificación estadística según el MAE. Según la siguiente tabla, podemos clasificar el mantenimiento de una planta en 3 tipos: muy bueno (por debajo de la media), correcto (en la media) y 'mejorable' (por encima de la media):"
          )}`,
          style: 'p',
        },

        '\n',

        // Imagen maeCurva
        {
          image: this.imgCurvaMaeBase64,
          width: this.widthCurvaMae,
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
                      text: this.t.t('MAE de la planta'),
                      style: 'tableHeader',
                    },
                    {
                      text: this.capFirstLetter(this.t.t('estado')),
                      style: 'tableHeader',
                    },
                  ],
                  [
                    {
                      text: '% MAE < ' + this.global.mae[0],
                      style: ['mae1', 'bold'],
                    },
                    {
                      text: this.capFirstLetter(this.t.t('muy bueno')),
                      style: 'mae1',
                    },
                  ],
                  [
                    {
                      text: this.global.mae[0].toString() + ' < % MAE <  ' + this.global.mae[1].toString(),
                      style: ['mae2', 'bold'],
                    },
                    {
                      text: this.capFirstLetter(this.t.t('correcto')),
                      style: 'mae2',
                    },
                  ],
                  [
                    {
                      text: '% MAE > ' + this.global.mae[1],
                      style: ['mae3', 'bold'],
                    },
                    {
                      text: this.capFirstLetter(this.t.t('mejorable')),
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
          text: `${index} - ${this.t.t('Cómo se clasifican las anomalías térmicas (según IEC 62446-3)')}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.t.t(
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
                  text: `CoA 1 - ${this.t.t('sin anomalía')}`,
                  style: ['coa1', 'bold'],
                },
                `: ${this.t.t('hacemos seguimiento, pero no hay que actuar.')}`,
              ],
              style: 'p',
            },
            {
              text: [
                {
                  text: `CoA 2 - ${this.t.t('anomalía térmica')}`,
                  style: ['coa2', 'bold'],
                },
                ': ',
                this.t.t('ver la causa y, si es necesario, arreglar en un periodo razonable.'),
              ],
              style: 'p',
            },
            {
              text: [
                {
                  text: `CoA 3 - ${this.t.t('anomalía térmica relevante para la seguridad')}`,
                  style: ['coa3', 'bold'],
                },
                `: ${this.t.t(
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

    const localizar = (index: string) => {
      return [
        {
          text: `${index} - ${this.t.t('Cómo localizar las anomalías')}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.t.t(
            'Todas las incidencias tienen asociada una localización GPS, cuyo margen de error es de unos pocos metros (0-2 metros).'
          ),
          style: 'p',
        },

        '\n',

        {
          text: this.getTextoLocalizar(),
          style: 'p',
        },

        '\n\n',
      ];
    };

    const resultados = (index: string) => {
      return [
        {
          text: `${index} - ${this.t.t('Resultados de la inspección termográfica')}`,
          style: 'h2',
          pageBreak: 'before',
          alignment: 'center',
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
          text: `${index} - ${this.t.t('Resultados por clase de anomalía')} (CoA)`,
          style: 'h3',
        },

        '\n',

        {
          text: this.t.t(
            'A continuación se detallan la cantidad de incidencias registradas según su clase (1, 2 ó 3).'
          ),
          style: 'p',
        },

        {
          text: [
            `${this.t.t('Se han registrado un total de')} `,
            { text: this.countClase[0] + this.countClase[1] + this.countClase[2], style: 'bold' },
            ` ${this.t.t('anomalías térmicas, de las cuales')} ${this.countClase[0]} ${this.t.t('son de clase')} 1, ${
              this.countClase[1]
            } ${this.t.t('son de clase')} 2  ${this.t.t('y')} ${this.countClase[2]} ${this.t.t('son de clase')} 3.`,
          ],
          style: 'p',
        },

        '\n\n',
      ];
    };

    const resultadosCategoria = (index: string) => {
      return [
        {
          text: `${index} - ${this.t.t('Resultados por categoría de la anomalía')}`,
          style: 'h3',
        },

        '\n',

        {
          text: `${this.t.t(
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
                      text: this.t.t('Categoría'),
                      style: 'tableHeaderRed',
                    },

                    {
                      text: this.t.t('Cantidad'),
                      style: 'tableHeaderRed',
                    },

                    {
                      text: this.t.t('Porcentaje %'),
                      style: 'tableHeaderRed',
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
                        text: this.filteredPcs.length.toString(),
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
            },
          ],
        },

        '\n\n',
      ];
    };

    const resultadosSeguidor = (index: string) => {
      const numAnomaliasMedia = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 2 }).format(
        this.filteredPcs.length / this.filteredSeguidores.length
      );
      let numeroSeguidores = 0;
      let porcentajeSeguidores = 0;
      if (this.planta.hasOwnProperty('numeroSeguidores')) {
        numeroSeguidores = this.planta.numeroSeguidores;
        porcentajeSeguidores = (this.filteredSeguidores.length / numeroSeguidores) * 100;
      }
      return [
        {
          text: `${index} - ${this.t.t('Resultados por seguidores')}`,
          style: 'h3',
        },

        '\n',
        `${this.t.t('El número de seguidores afectados por anomalías térmicas es')} ${this.filteredSeguidores.length}${
          numeroSeguidores === 0 ? '. ' : `/${numeroSeguidores} (${porcentajeSeguidores.toFixed(2)}%). `
        } ${this.t.t('El número medio de módulos con anomalías por seguidor es de')} ${numAnomaliasMedia} ${this.t.t(
          'módulos/seguidor'
        )}.`,
        '\n',
        '\n',
      ];
    };

    const resultadosPosicion = (index: string) => {
      let texto1;
      if (this.planta.tipo === 'seguidores') {
        texto1 = `${this.t.t(
          'Los números de la siguiente tabla indican la cantidad de anomalías térmicas registradas en la posición en la que se encuentran'
        )} (${this.plantaService.getNombreLocalX(this.planta)} ${this.t.t('y')} ${this.plantaService.getNombreLocalY(
          this.planta
        )}) ${this.t.t('dentro de cada seguidor. Sólo se incluyen anomalías térmicas de clase 2 y 3.')}`;
      } else {
        texto1 = this.t.t(
          'Los números de la siguiente tabla indican la cantidad de anomalías térmicas registradas por altura. Sólo se incluyen anomalías térmicas de clase 2 y 3.'
        );
      }
      return [
        {
          text: `${index} - ${this.t.t('Resultados por posición de la anomalía dentro del seguidor')}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.t.t(
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
                body: this.getTablaPosicion(),
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
          text: `${index} - ${this.t.t('MAE de la planta')}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.t.t(
            'El MAE (módulo apagados equivalentes) nos da medida cualitativa del impacto que tienen las incidencias registradas en el PR (performance ratio) de la planta.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: `MAE = ∆PR / PR = ${this.decimalPipe.transform(this.informe.mae, '1.0-2')} % (${this.calificacionMae(
            this.informe.mae
          )})`,
          style: 'param',
        },

        '\n',

        {
          text: [
            `${this.t.t('El MAE de')} ${this.planta.nombre} (${this.datePipe.transform(
              this.informe.fecha * 1000,
              'dd/MM/yyyy'
            )}) ${this.t.t('es')} `,
            {
              text: `${this.decimalPipe.transform(this.informe.mae, '1.0-2')} %`,
              style: 'bold',
            },
            ' ',
            '(',
            {
              text: `${this.calificacionMae(this.informe.mae)}`,
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
        text: `1 - ${this.t.t('Introducción')}`,
        style: 'h2',
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

    if (this.filtroApartados.includes('localizar')) {
      apartado = titulo.toString().concat('.').concat(subtitulo.toString());
      result = result.concat(localizar(apartado));
      subtitulo = subtitulo + 1;
    }

    titulo = titulo + 1;
    subtitulo = 1;
    apartado = '2';

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

  // getTextoSeguidor(pc: PcInterface, planta: PlantaInterface) {
  //   let seguidor: string;
  //   if (planta.tipo === "seguidores") {
  //     // Columna 'globalX'
  //     seguidor =
  //       !pc.hasOwnProperty("global_y") || pc["global_y"] === "NaN"
  //         ? String(pc["global_x"])
  //         : String(pc["global_x"])
  //             .concat(" ")
  //             .concat(String(pc["global_y"]));
  //   } else {
  //     if (Number.isNaN(pc["global_x"])) {
  //       seguidor = pc["global_y"];
  //     } else {
  //       seguidor = pc["global_x"]
  //         .toString()
  //         .concat(" ")
  //         .concat(pc["global_y"]);
  //     }
  //   }

  //   return seguidor;
  // }

  getAnexoLista(numAnexo: string) {
    const allPagsAnexoLista = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n ${this.t.t('Anexo')} ${numAnexo}: ${this.t.t(
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
      text: this.t.t('Número'),
      style: 'tableHeaderRed',
    });

    if (this.planta.tipo === 'seguidores') {
      this.filteredPcs = this.filteredPcs.sort(this.pcService.sortByGlobals);
      cabecera.push({
        text: this.t.t('Seguidor'),
        style: 'tableHeaderRed',
        noWrap: true,
      });
    } else {
      this.filteredPcs = this.filteredPcs.sort(this.pcService.sortByGlobals);
      let nombreCol = this.t.t(this.plantaService.getNombreGlobalX(this.planta));
      if (nombreCol.length > 0) {
        nombreCol = nombreCol.concat(this.plantaService.getGlobalsConector());
      }
      nombreCol = nombreCol.concat(this.t.t(this.plantaService.getNombreGlobalY(this.planta)));
      cabecera.push({
        text: nombreCol,
        style: 'tableHeaderRed',
        noWrap: true,
      });
    }

    for (const c of this.currentFilteredColumnas) {
      cabecera.push({
        text: this.t.t(this.getEncabezadoTablaSeguidor(c)),
        style: 'tableHeaderRed',
      });
    }

    // Body
    const body = [];
    let contadorPcs = 0;
    const totalPcs = this.filteredPcs.length;
    for (const pc of this.filteredPcs) {
      contadorPcs += 1;

      const row = [];
      row.push({
        text: `${contadorPcs}/${totalPcs}`,
        noWrap: true,
        style: 'tableCellAnexo1',
      });
      row.push({
        text: this.plantaService.getEtiquetaGlobals(pc),
        noWrap: true,
        style: 'tableCellAnexo1',
      });
      for (let c of this.currentFilteredColumnas) {
        row.push({
          text: this.t.t(this.getTextoColumnaPc(pc, c.nombre)),
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

  getTextoColumnaPc(pc: PcInterface, columnaNombre: string): string {
    if (columnaNombre === 'tipo') {
      return this.pcDescripcion[pc['tipo']];
    } else if (columnaNombre === 'gradienteNormalizado' || columnaNombre === 'temperaturaMax') {
      return (Math.round(pc[columnaNombre] * 10) / 10).toString().concat(' ºC');
    } else if (columnaNombre === 'irradiancia') {
      return Math.round(pc['irradiancia']).toString().concat(' W/m2');
    } else if (columnaNombre === 'datetimeString') {
      return this.datePipe
        .transform(this.informe.fecha * 1000, 'dd/MM/yyyy')
        .concat(' ')
        .concat(this.datePipe.transform(pc.datetime * 1000, 'HH:mm:ss'));
    } else if (columnaNombre === 'local_xy') {
      return this.plantaService.getNumeroModulo(pc).toString();
    } else if (columnaNombre === 'severidad') {
      return this.pcService.getPcCoA(pc).toString();
    } else {
      return pc[columnaNombre];
    }
  }

  getEncabezadoTablaSeguidor(columna) {
    if (columna.nombre === 'local_xy') {
      if (this.planta.hasOwnProperty('etiquetasLocalXY')) {
        return 'Nº Módulo';
      }
    }
    return columna.descripcion;
  }

  getPaginaSeguidor(seguidor: SeguidorInterface) {
    // Header
    const cabecera = [];
    let columnasAnexoSeguidor = this.currentFilteredColumnas.filter((col) => {
      return !GLOBAL.columnasAnexoSeguidor.includes(col.nombre);
    });
    if (this.planta.hasOwnProperty('numerosSerie')) {
      if (this.planta.numerosSerie) {
        columnasAnexoSeguidor.push({ nombre: 'numeroSerie', descripcion: 'N/S' });
      }
    }

    cabecera.push({
      text: this.t.t('Número'),
      style: 'tableHeaderRed',
    });
    for (const col of columnasAnexoSeguidor) {
      cabecera.push({
        text: this.t.t(this.getEncabezadoTablaSeguidor(col)),
        style: 'tableHeaderRed',
      });
    }

    // Body
    const body = [];
    let contadorPcs = 0;
    const totalPcsSeguidor = seguidor.pcs.length;
    for (const pc of seguidor.pcs) {
      contadorPcs += 1;
      const row = [];
      row.push({
        text: `${contadorPcs}/${totalPcsSeguidor}`,
        noWrap: true,
        style: 'tableCellAnexo1',
      });

      for (const col of columnasAnexoSeguidor) {
        row.push({
          text: this.t.t(this.getTextoColumnaPc(pc, col.nombre)),
          noWrap: true,
          style: 'tableCellAnexo1',
        });
      }
      body.push(row);
    }
    return [cabecera, body];
  }

  writeModulo(pc: PcInterface) {
    if (!pc.hasOwnProperty('modulo')) {
      return '-';
    }
    const modulo = pc.modulo;
    let new_row = '';
    if (modulo !== null) {
      if (modulo.hasOwnProperty('marca')) {
        new_row = new_row.concat(modulo['marca'].toString()).concat(' ');
      }
      if (modulo.hasOwnProperty('modelo')) {
        new_row = new_row.concat(modulo['modelo'].toString()).concat(' ');
      }
      if (modulo.hasOwnProperty('potencia')) {
        new_row = new_row.concat('(').concat(modulo['potencia'].toString()).concat(' W)');
      }
    }

    return new_row;
  }

  getAnexoSeguidores(numAnexo: string) {
    const allPagsAnexo = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n ${this.t.t('Anexo')} ${numAnexo}: ${this.t.t(
        'Anomalías térmicas por seguidor'
      )}`,
      style: 'h1',
      alignment: 'center',
      pageBreak: 'before',
    };

    allPagsAnexo.push(pag1Anexo);

    for (const s of this.filteredSeguidores) {
      const table = this.getPaginaSeguidor(s);

      const pagAnexo = [
        {
          text: `${this.t.t('Seguidor')} ${s.nombre}`,
          style: 'h2',
          alignment: 'center',
          pageBreak: 'before',
        },

        '\n',

        {
          image: `imgSeguidorCanvas${s.nombre}`,
          width: this.widthSeguidor,
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
                      text: this.t.t('Fecha/Hora'),
                      style: 'tableHeaderImageData',
                    },

                    {
                      text: this.t.t('Irradiancia'),
                      style: 'tableHeaderImageData',
                    },

                    {
                      text: this.t.t('Temp. aire'),
                      style: 'tableHeaderImageData',
                    },

                    {
                      text: this.t.t('Viento'),
                      style: 'tableHeaderImageData',
                    },

                    {
                      text: this.t.t('Emisividad'),
                      style: 'tableHeaderImageData',
                    },

                    {
                      text: this.t.t('Temp. reflejada'),
                      style: 'tableHeaderImageData',
                    },
                    {
                      text: this.t.t('Módulo'),
                      style: 'tableHeaderImageData',
                    },
                  ],
                  [
                    {
                      text: this.datePipe
                        .transform(this.informe.fecha * 1000, 'dd/MM/yyyy')
                        .concat(' ')
                        .concat(this.datePipe.transform(s.pcs[0].datetime * 1000, 'HH:mm:ss')),
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },

                    {
                      text: Math.round(s.pcs[0].irradiancia).toString().concat(' W/m2'),
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },
                    {
                      text: Math.round(s.pcs[0].temperaturaAire).toString().concat(' ºC'),
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },

                    {
                      text: s.pcs[0].viento,
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },

                    {
                      text: s.pcs[0].emisividad,
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },

                    {
                      text: Math.round(s.pcs[0].temperaturaReflejada).toString().concat(' ºC'),
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },

                    {
                      text: this.writeModulo(s.pcs[0]),
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

    return allPagsAnexo;
  }
  getAnexoSeguidores1eje(numAnexo: string) {
    const allPagsAnexo = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n ${this.t.t('Anexo')} ${numAnexo}: ${this.t.t(
        'Anomalías térmicas por seguidor'
      )}`,
      style: 'h1',
      alignment: 'center',
      pageBreak: 'before',
    };

    allPagsAnexo.push(pag1Anexo);

    for (const s of this.filteredSeguidores) {
      const table = this.getPaginaSeguidor(s);

      const pagAnexo = [
        {
          text: `${this.t.t('Seguidor')} ${s.nombre}`,
          style: 'h2',
          alignment: 'center',
          pageBreak: 'before',
        },

        '\n',

        // Si son segudores de 1 eje, le quitamos la imagen (porque)
        // {
        //   image: `imgSeguidorCanvas${s.nombre}`,
        //   width: this.widthSeguidor,
        //   alignment: 'center'
        // },

        // '\n',

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
                      text: this.t.t('Fecha/Hora'),
                      style: 'tableHeaderImageData',
                    },

                    {
                      text: this.t.t('Irradiancia'),
                      style: 'tableHeaderImageData',
                    },

                    {
                      text: this.t.t('Temp. aire'),
                      style: 'tableHeaderImageData',
                    },

                    {
                      text: this.t.t('Viento'),
                      style: 'tableHeaderImageData',
                    },

                    {
                      text: this.t.t('Emisividad'),
                      style: 'tableHeaderImageData',
                    },

                    {
                      text: this.t.t('Temp. reflejada'),
                      style: 'tableHeaderImageData',
                    },
                    {
                      text: this.t.t('Módulo'),
                      style: 'tableHeaderImageData',
                    },
                  ],
                  [
                    {
                      text: this.datePipe
                        .transform(this.informe.fecha * 1000, 'dd/MM/yyyy')
                        .concat(' ')
                        .concat(this.datePipe.transform(s.pcs[0].datetime * 1000, 'HH:mm:ss')),
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },

                    {
                      text: Math.round(s.pcs[0].irradiancia).toString().concat(' W/m2'),
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },
                    {
                      text: Math.round(s.pcs[0].temperaturaAire).toString().concat(' ºC'),
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },

                    {
                      text: s.pcs[0].viento,
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },

                    {
                      text: s.pcs[0].emisividad,
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },

                    {
                      text: Math.round(s.pcs[0].temperaturaReflejada).toString().concat(' ºC'),
                      style: 'tableCellAnexo1',
                      noWrap: true,
                    },

                    {
                      text: this.writeModulo(s.pcs[0]),
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

    return allPagsAnexo;
  }

  getDocDefinition(imagesSeguidores): TDocumentDefinitions {
    const pages = this.getPagesPDF();
    let anexo1 = [];
    let anexo2 = [];
    let numAnexo = 'I';

    if (this.filtroApartados.includes('anexo1')) {
      anexo1 = this.getAnexoLista(numAnexo);
      numAnexo = 'II';
    }
    if (this.filtroApartados.includes('anexo2')) {
      anexo2 = this.getAnexoSeguidores(numAnexo);
    }
    if (this.filtroApartados.includes('anexo2b')) {
      anexo2 = this.getAnexoSeguidores1eje(numAnexo);
    }

    return {
      header: (currentPage, pageCount) => {
        if (currentPage > 1) {
          return [
            {
              margin: 10,
              columns: [
                {
                  // usually you would use a dataUri instead of the name for client-side printing
                  // sampleImage.jpg however works inside playground so you can play with it
                  margin: [300 - this.widthLogo * this.scaleImgLogoHeader, 0, 0, 0],
                  image: this.imgLogoBase64,
                  width: this.scaleImgLogoHeader * this.widthLogo,
                },
              ],
            },
          ];
        }
      },

      content: pages.concat(anexo1).concat(anexo2),

      images: imagesSeguidores,

      footer: (currentPage, pageCount) => {
        if (currentPage > 1) {
          return [
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      text: currentPage,
                      alignment: 'center',
                      color: 'grey',
                      margin: [0, 10, 0, 0],
                    },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ];
        }
      },

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
        tableHeaderRed: {
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
      },
    };
  }
}
