import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import pdfMake from 'pdfmake/build/pdfmake.js';

import { ReportControlService } from '@core/services/report-control.service';
import { DownloadReportService } from '@core/services/download-report.service';

import { Seguidor } from '@core/models/seguidor';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-download-pdf',
  templateUrl: './download-pdf.component.html',
  styleUrls: ['./download-pdf.component.css'],
  providers: [DecimalPipe, DatePipe],
})
export class DownloadPdfComponent implements OnInit {
  private generandoPDF = false;
  private _countLoadedImages = 0;
  countLoadedImages$ = new BehaviorSubject<number>(this._countLoadedImages);
  private countSeguidores: number;
  private progresoPDF: string;
  private allSeguidores: Seguidor[];
  private planta: PlantaInterface;
  private informe: InformeInterface;
  // IMAGENES
  private jpgQuality: number;

  constructor(
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
    private reportControlService: ReportControlService,
    private downloadReportService: DownloadReportService
  ) {}

  ngOnInit(): void {}

  public downloadPDF() {
    this.generandoPDF = true;

    const imageListBase64 = {};
    this.countLoadedImages = 0;
    this.countSeguidores = 1;

    this.reportControlService.allFilterableElements$.pipe(take(1)).subscribe((elems) => {
      this.allSeguidores = elems.sort(this.downloadReportService.sortByGlobalCoords) as Seguidor[];

      this.allSeguidores.forEach((seguidor) => {
        // const canvas = $(`canvas[id="imgSeguidorCanvas${seguidor.nombre}"]`)[0] as HTMLCanvasElement;
        const canvas = document.createElement('canvas');
        canvas.id = `imgSeguidorCanvas${seguidor.nombre}`;
        imageListBase64[`imgSeguidorCanvas${seguidor.nombre}`] = canvas.toDataURL('image/jpeg', this.jpgQuality);
        this.progresoPDF = this.decimalPipe.transform((100 * this.countLoadedImages) / this.countSeguidores, '1.0-0');
      });

      this.calcularInforme();

      pdfMake.createPdf(this.getDocDefinition(imageListBase64)).download(this.informe.prefijo.concat('informe'));
      this.generandoPDF = false;
    });

    // Generar imagenes
    this.countSeguidores = 0;
    for (const seguidor of this.allSeguidores) {
      this.setImgSeguidorCanvas(seguidor, false);
      this.countSeguidores++;
    }
  }

  private calcularInforme() {
    this.translation = new Translation(this.lan);
    this.countCategoria = Array();
    this.countCategoriaClase = Array();
    this.countClase = Array();
    this.countPosicion = Array();

    this.informeCalculado = false;
    let elements;
    if (this.reportControlService.plantaFija) {
      elements = this.allElements as Anomalia[];
    } else {
      elements = this.allElements as Seguidor[];
    }

    if (elements.length > 0) {
      this.irradianciaMedia = Math.round(
        elements.sort(this.compareIrradiancia)[Math.round(elements.length / 2)].irradiancia
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
          countColumnas.push(elements.filter((pc) => pc.localX === x && pc.localY === y).length);
        } else {
          countColumnas.push(elements.filter((pc) => pc.localY === y).length);
        }
      }
      this.countPosicion.push(countColumnas);
    }

    // CATEGORIAS //
    let filtroCategoria;
    let filtroCategoriaClase;
    for (const cat of this.numTipos) {
      filtroCategoria = elements.filter((pc) => pc.tipo === cat);
      this.countCategoria.push(filtroCategoria.length);

      let count1 = Array();
      for (const clas of this.numClases) {
        filtroCategoriaClase = elements.filter((pc) => this.pcService.getPcCoA(pc) === clas && pc.tipo === cat);
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
      filtroClase = elements.filter((pc) => this.pcService.getPcCoA(pc) === j);

      this.countClase.push(filtroClase.length);
    }

    this.informeCalculado = true;
    this.dataSource = new MatTableDataSource(this.countCategoriaClase);
  }

  getDocDefinition(imagesSeguidores) {
    const pages = this.getPagesPDF();
    let anexo1 = [];
    let anexo2 = [];
    let numAnexo = 'I';

    if (this.filtroApartados.includes('anexo1')) {
      anexo1 = this.getAnexoLista(numAnexo);
      numAnexo = 'II';
    }
    // if (this.filtroApartados.includes('anexo2')) {
    //   anexo2 = this.getAnexoSeguidores(numAnexo);
    // }
    // if (this.filtroApartados.includes('anexo2b')) {
    //   anexo2 = this.getAnexoSeguidores1eje(numAnexo);
    // }

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

  //////////////////////////////////////////////////////

  get countLoadedImages() {
    return this._countLoadedImages;
  }

  set countLoadedImages(value: number) {
    this._countLoadedImages = value;
    this.countLoadedImages$.next(value);
  }
}
