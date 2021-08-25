import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { AngularFireStorage } from '@angular/fire/storage';

import { MatTableDataSource } from '@angular/material/table';

import { BehaviorSubject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import pdfMake from 'pdfmake/build/pdfmake.js';

import 'fabric';
declare let fabric;

import { ReportControlService } from '@core/services/report-control.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PlantaService } from '@core/services/planta.service';
import { GLOBAL } from '@core/services/global';
import { DownloadReportService } from '@core/services/download-report.service';

import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { Translation } from 'src/app/informe-export/components/export/translations';

export interface Apartado {
  nombre: string;
  descripcion: string;
  orden: number;
  elegible: boolean;
  apt?: number;
}

export interface AnomsTable {
  // antes PcsTable
  tipo: string;
  coa1: number;
  coa2: number;
  coa3: number;
  total: number;
}

@Component({
  selector: 'app-download-pdf',
  templateUrl: './download-pdf.component.html',
  styleUrls: ['./download-pdf.component.css'],
  providers: [DecimalPipe, DatePipe],
})
export class DownloadPdfComponent implements OnInit {
  generandoPDF = false;
  private _countLoadedImages = 0;
  countLoadedImages$ = new BehaviorSubject<number>(this._countLoadedImages);
  private allAnomalias: Anomalia[];
  private planta: PlantaInterface;
  private informe: InformeInterface;
  private _columnasAnomalia: any[] = []; // antes pcColumnas
  columnasAnomalia$ = new BehaviorSubject<any[]>(this._columnasAnomalia); // equvalente a currentFilteredColumnas$
  private filtroColumnas: string[];
  private arrayFilas: Array<number>;
  private arrayColumnas: Array<number>;
  // IMAGENES
  private irradianciaImg$: Observable<string | null>;
  private suciedadImg$: Observable<string | null>;
  private portadaImg$: Observable<string | null>;
  private logoImg$: Observable<string | null>;
  private widthIrradiancia: number;
  private imgQuality: number;
  private jpgQuality: number;
  private widthPortada: number;
  private widthLogo: number;
  private widthLogoOriginal: number;
  private widthSuciedad: number;
  private widthCurvaMae: number;
  private widthFormulaMae: number;
  private scaleImgLogoHeader: number;
  private heightLogoHeader: number;
  private imgLogoBase64: string;
  private imgIrradianciaBase64: string;
  private imgPortadaBase64: string;
  private imgSuciedadBase64: string;
  private imgFormulaMaeBase64: string;
  private imgCurvaMaeBase64: string;

  private apartadosInforme: Apartado[];
  private filtroApartados: string[];
  private progresoPDF: string;
  private hasUserArea: boolean;
  private translation: Translation;
  private language: string; // antes lan
  private countCategoria;
  private countPosicion;
  private countCategoriaClase;
  private countClase;
  private informeCalculado: boolean;
  private dataSource: MatTableDataSource<AnomsTable>;
  private irradianciaMedia: number;
  private tempReflejada: number;
  private emisividad: number;
  private numTipos: number[];
  private numClases: number[];
  private anomTipos = GLOBAL.labels_tipos; // antes pcDescripcion
  private currentFiltroGradiente: number;

  constructor(
    private reportControlService: ReportControlService,
    private anomaliaService: AnomaliaService,
    private plantaService: PlantaService,
    private storage: AngularFireStorage,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
    private downloadReportService: DownloadReportService
  ) {}

  ngOnInit(): void {
    this.numTipos = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);
    this.numClases = Array(GLOBAL.labels_clase.length)
      .fill(0)
      .map((_, i) => i + 1);

    this.plantaService
      .getPlanta(this.reportControlService.plantaId)
      .pipe(take(1))
      .subscribe((planta) => {
        this.planta = planta;

        this.plantaService.planta = planta;

        this.columnasAnomalia = this.getColumnasAnom(this.planta);

        this.filtroColumnas = this.columnasAnomalia.map((element) => element.nombre);

        this.arrayFilas = Array(this.planta.filas)
          .fill(0)
          .map((_, i) => i + 1);
        this.arrayColumnas = Array(this.planta.columnas)
          .fill(0)
          .map((_, i) => i + 1);

        this.allAnomalias = this.reportControlService.allFilterableElements as Anomalia[];

        this.calcularInforme();

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
                this.widthIrradiancia * this.imgQuality > img.width
                  ? img.width
                  : this.widthIrradiancia * this.imgQuality;
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

        this.suciedadImg$.pipe(take(1)).subscribe((url) => {
          fabric.util.loadImage(
            url,
            (img) => {
              const canvas = document.createElement('canvas');
              const width =
                this.widthIrradiancia * this.imgQuality > img.width
                  ? img.width
                  : this.widthIrradiancia * this.imgQuality;
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
              const newWidth =
                this.widthLogo * this.imgQuality > img.width ? img.width : this.widthLogo * this.imgQuality;
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

        this.apartadosInforme = this.apartadosInforme.sort((a: Apartado, b: Apartado) => {
          return a.orden - b.orden;
        });

        this.filtroApartados = this.apartadosInforme.map((element) => element.nombre);
      });

    this.informe = this.reportControlService.informes.find(
      (informe) => this.reportControlService.selectedInformeId === informe.id
    );

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
    this.hasUserArea = false;

    this.plantaService.getUserAreas$(this.reportControlService.plantaId).subscribe((userAreas) => {
      if (userAreas.length > 0) {
        this.hasUserArea = true;
      }
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
  }

  public downloadPDF() {
    this.generandoPDF = true;
    this.countLoadedImages = null;

    this.reportControlService.allFilterableElements$.pipe(take(1)).subscribe((elems) => {
      this.allAnomalias = elems.sort(this.anomaliaService.sortByLocalId) as Anomalia[];

      this.calcularInforme();

      pdfMake
        .createPdf(this.getDocDefinition())
        .download(/* this.informe.prefijo.concat('informe') */ 'Informe', (cb) => {
          this.generandoPDF = false;
        });
    });
  }

  private calcularInforme() {
    this.translation = new Translation(this.language);
    this.countCategoria = Array();
    this.countCategoriaClase = Array();
    this.countClase = Array();
    this.countPosicion = Array();

    this.informeCalculado = false;

    if (this.allAnomalias.length > 0) {
      this.irradianciaMedia = Math.round(
        this.allAnomalias.sort(this.compareIrradiancia)[Math.round(this.allAnomalias.length / 2)].irradiancia
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
          countColumnas.push(this.allAnomalias.filter((pc) => pc.localX === x && pc.localY === y).length);
        } else {
          countColumnas.push(this.allAnomalias.filter((pc) => pc.localY === y).length);
        }
      }
      this.countPosicion.push(countColumnas);
    }

    // CATEGORIAS //
    let filtroCategoria;
    let filtroCategoriaClase;
    for (const cat of this.numTipos) {
      filtroCategoria = this.allAnomalias.filter((pc) => pc.tipo === cat);
      this.countCategoria.push(filtroCategoria.length);

      const count1 = Array();
      for (const clas of this.numClases) {
        filtroCategoriaClase = this.allAnomalias.filter((anom) => anom.clase === clas && anom.tipo === cat);
        count1.push(filtroCategoriaClase.length);
      }
      const totalPcsInFilter = count1[0] + count1[1] + count1[2];
      if (totalPcsInFilter > 0) {
        this.countCategoriaClase.push({
          categoria: this.anomTipos[cat],
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
      filtroClase = this.allAnomalias.filter((anom) => anom.clase === j);

      this.countClase.push(filtroClase.length);
    }

    this.informeCalculado = true;
    this.dataSource = new MatTableDataSource(this.countCategoriaClase);
  }

  getColumnasAnom(planta: PlantaInterface): any[] {
    const columnasTemp = GLOBAL.columnasAnomPdf;

    // const i = columnasTemp.findIndex((e) => e.nombre === 'local_xy');
    // let descripcion = '';
    // planta.nombreGlobalCoords.forEach((nombre, index, nombres) => {
    //   descripcion = descripcion.concat(nombre);
    //   // a ultimo no se lo añadimos
    //   if (index < nombres.length - 1) {
    //     descripcion = descripcion.concat('/');
    //   }
    // });

    // columnasTemp[i].descripcion = descripcion;

    return columnasTemp;
  }

  getDocDefinition() {
    const pages = this.getPagesPDF();
    let anexo1 = [];
    let numAnexo = 'I';

    if (this.filtroApartados.includes('anexo1')) {
      anexo1 = this.getAnexoLista(numAnexo);
      numAnexo = 'II';
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

      content: pages.concat(anexo1),

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

  getPagesPDF() {
    // PORTADA //
    const portada: any[] = [
      {
        text: this.translation.t('Análisis termográfico aéreo de módulos fotovoltaicos'),
        style: 'h1',
        alignment: 'center',
      },

      '\n',

      // {
      //   image: this.imgPortadaBase64,
      //   width: this.widthPortada,
      //   alignment: 'center',
      // },

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
      return [
        {
          text: `${index} - ${this.translation.t('Datos del vuelo')}`,
          style: 'h3',
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
                body: [
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
                      text: `${GLOBAL.uav}`,
                    },
                  ],
                  [
                    {
                      text: this.translation.t('Cámara térmica'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${GLOBAL.camaraTermica}`,
                    },
                  ],
                  [
                    {
                      text: this.translation.t('Última calibración'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${GLOBAL.ultimaCalibracion}`,
                    },
                  ],

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
                      text: this.datePipe.transform(this.informe.fecha * 1000, 'dd/MM/yyyy'),
                    },
                  ],

                  [
                    {
                      text: this.translation.t('Horario de los vuelos'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.informe.hora_inicio} - ${this.informe.hora_fin}`,
                    },
                  ],

                  [
                    {
                      text: this.translation.t('Velocidad'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.informe.velocidad} km/h`,
                    },
                  ],

                  [
                    {
                      text: this.translation.t('GSD térmico (medio)'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.informe.gsd} cm/pixel (+- 0.5cm/pixel)`,
                    },
                  ],

                  [
                    {
                      text: this.translation.t('GSD visual'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${Math.round(this.informe.gsd * 0.16 * 100) / 100} cm/pixel`,
                    },
                  ],

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
                      text: this.translation.t('Irradiancia (media)'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.irradianciaMedia} W/m2`,
                    },
                  ],

                  [
                    {
                      text: this.translation.t('Temperatura del aire'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.informe.temperatura} ºC`,
                    },
                  ],

                  [
                    {
                      text: this.translation.t('Nubosidad'),
                      style: 'tableLeft',
                    },
                    {
                      text: `${this.informe.nubosidad}/8 ${this.translation.t('octavas')}`,
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
          text: `${index} - ${this.translation.t('Irradiancia durante el vuelo')}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.getTextoIrradiancia(),
          style: 'p',
        },

        '\n',

        // {
        //   image: this.imgIrradianciaBase64,
        //   width: this.widthIrradiancia,
        //   alignment: 'center',
        // },

        '\n\n',
      ];
    };

    const paramsTermicos = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Ajuste de parámetros térmicos')}`,
          style: 'h3',
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
          text: this.translation.t('Emisividad') + '  = ' + this.informe.emisividad.toString(),
          style: 'param',
        },

        '\n',

        // Imagen suciedad
        // {
        //   image: this.imgSuciedadBase64,
        //   width: this.widthSuciedad,
        //   alignment: 'center',
        // },

        '\n\n',

        {
          text: `${index}.2 - ${this.capFirstLetter(this.translation.t('temperatura reflejada'))}`,
          style: 'h4',
        },

        '\n',

        {
          text: this.translation.t(
            'La temperatura reflejada nos depende de la atmosfera y las condiciones meteorológicas del día del vuelo. Para obtener este parámetro es necesario llevar a cabo un procedimiento de medición adecuado en la misma planta el mismo día del vuelo. La temperatura reflejada medida es:'
          ),
          style: 'p',
        },

        '\n',

        {
          text:
            this.capFirstLetter(this.translation.t('temperatura reflejada')) +
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
          text: `${index} - ${this.translation.t('Pérdida de Performance Ratio')} (ΔPR)`,
          style: 'h3',
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
          width: this.widthFormulaMae,
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
                      text: '% MAE < ' + GLOBAL.mae[0],
                      style: ['mae1', 'bold'],
                    },
                    {
                      text: this.capFirstLetter(this.translation.t('muy bueno')),
                      style: 'mae1',
                    },
                  ],
                  [
                    {
                      text: GLOBAL.mae[0].toString() + ' < % MAE <  ' + GLOBAL.mae[1].toString(),
                      style: ['mae2', 'bold'],
                    },
                    {
                      text: this.capFirstLetter(this.translation.t('correcto')),
                      style: 'mae2',
                    },
                  ],
                  [
                    {
                      text: '% MAE > 0.2',
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

    const localizar = (index: string) => {
      return [
        {
          text: `${index} - ${this.translation.t('Cómo localizar las anomalías')}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.translation.t(
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
          text: `${index} - ${this.translation.t('Resultados de la inspección termográfica')}`,
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
          text: `${index} - ${this.translation.t('Resultados por clase de anomalía')} (CoA)`,
          style: 'h3',
        },

        '\n',

        {
          text: this.translation.t(
            'A continuación se detallan la cantidad de incidencias registradas según su clase (1, 2 ó 3).'
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
                        text: this.allAnomalias.length.toString(),
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

    const resultadosPosicion = (index: string) => {
      const texto1 = this.translation.t(
        'Los números de la siguiente tabla indican la cantidad de anomalías térmicas registradas por altura. Sólo se incluyen anomalías térmicas de clase 2 y 3.'
      );

      return [
        {
          text: `${index} - ${this.translation.t('Resultados por posición de la anomalía dentro del seguidor')}`,
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
          text: `${index} - ${this.translation.t('MAE de la planta')}`,
          style: 'h3',
        },

        '\n',

        {
          text: this.translation.t(
            'El MAE (módulo apagados equivalentes) nos da medida cualitativa del impacto que tienen las incidencias registradas en el PR (performance ratio) de la planta.'
          ),
          style: 'p',
        },

        '\n',

        {
          text: `MAE = ∆PR / PR = ${this.decimalPipe.transform(this.informe.mae, '1.0-2')}% (${this.calificacionMae(
            this.informe.mae
          )})`,
          style: 'param',
        },

        '\n',

        {
          text: [
            `${this.translation.t('El MAE de')} ${this.planta.nombre} (${this.datePipe.transform(
              this.informe.fecha * 1000,
              'dd/MM/yyyy'
            )}) ${this.translation.t('es')} `,
            {
              text: `${this.decimalPipe.transform(this.informe.mae, '1.0-2')}%`,
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
        text: `1 - ${this.translation.t('Introducción')}`,
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

    this.allAnomalias = this.allAnomalias.sort((a, b) => this.downloadReportService.sortByPosition(a, b));

    let nombreCol = '';
    this.planta.nombreGlobalCoords.forEach((nombre, index, nombres) => {
      nombreCol.concat(nombre);
      // a ultimo no se lo añadimos
      if (index < nombres.length - 1) {
        nombreCol.concat(this.plantaService.getGlobalsConector());
      }
    });

    nombreCol = this.translation.t(nombreCol);

    cabecera.push({
      text: nombreCol,
      style: 'tableHeaderBlue',
      noWrap: true,
    });

    for (const col of this.columnasAnomalia) {
      cabecera.push({
        text: this.translation.t(this.getEncabezadoTablaAnomalias(col)),
        style: 'tableHeaderBlue',
      });
    }

    // Body
    const body = [];
    let contadorAnoms = 0;
    const totalAnoms = this.allAnomalias.length;
    for (const anom of this.allAnomalias) {
      contadorAnoms += 1;

      const row = [];
      row.push({
        text: `${contadorAnoms}/${totalAnoms}`,
        noWrap: true,
        style: 'tableCellAnexo1',
      });
      row.push({
        text: this.plantaService.getEtiquetaGlobals(anom),
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
    if (this.informe.irradiancia === 0) {
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

  private getTextoLocalizar() {
    return `${this.translation.t('Además todos ellos tienen asociado los parámetros')} '${this.translation.t(
      this.plantaService.getNombreGlobalX(this.planta)
    )}', '${this.translation.t(this.plantaService.getNombreGlobalY(this.planta))}', '${this.translation.t(
      this.plantaService.getNombreLocalX(this.planta)
    )}' ${this.translation.t('y')} '${this.translation.t(
      this.plantaService.getNombreLocalY(this.planta)
    )}' ${this.translation.t('según el mapa habitual de la planta')}.`;
  }

  private calificacionMae(mae: number) {
    if (mae <= 0.1) {
      return this.translation.t('muy bueno');
    } else if (mae <= 0.2) {
      return this.translation.t('correcto');
    } else {
      return this.translation.t('mejorable');
    }
  }

  private getEncabezadoTablaAnomalias(columna: any) {
    if (columna.nombre === 'local_xy') {
      if (this.planta.hasOwnProperty('etiquetasLocalXY')) {
        return 'Nº Módulo';
      }
    }
    return columna.descripcion;
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
        .transform(this.informe.fecha * 1000, 'dd/MM/yyyy')
        .concat(' ')
        .concat(this.datePipe.transform(anomalia.datetime * 1000, 'HH:mm:ss'));
    } else if (columnaNombre === 'local_xy') {
      return this.downloadReportService.getPositionModulo(this.planta, anomalia).toString();
    } else if (columnaNombre === 'severidad') {
      return anomalia.clase.toString();
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
                  .transform((this.countCategoria[i - 1] / this.allAnomalias.length) * 100, '1.0-1')
                  .toString() + '%',
            }
          )
        );
      }
    }

    return array;
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
        text: this.plantaService.getAltura(this.planta, j).toString(),
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

  ////////////////////////////////////////////////////

  get countLoadedImages() {
    return this._countLoadedImages;
  }

  set countLoadedImages(value: number) {
    this._countLoadedImages = value;
    this.countLoadedImages$.next(value);
  }

  get columnasAnomalia() {
    return this._columnasAnomalia;
  }

  set columnasAnomalia(value: any[]) {
    this._columnasAnomalia = value;
    this.columnasAnomalia$.next(value);
  }
}
