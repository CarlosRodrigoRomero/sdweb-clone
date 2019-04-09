import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { GLOBAL } from '../../services/global';

import { PlantaService } from '../../services/planta.service';
import { InformeService } from '../../services/informe.service';
import { PcService, SeguidorInterface } from '../../services/pc.service';

import { PcInterface } from '../../models/pc';
import { PlantaInterface } from '../../models/planta';
import { InformeInterface } from '../../models/informe';

import 'fabric';
declare let fabric;

import html2pdf from 'html2pdf.js';
import { AngularFireStorage } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-informe-export',
  templateUrl: './informe-export.component.html',
  styleUrls: ['./informe-export.component.css'],
  providers: [InformeService, PlantaService, PcService]
})

export class InformeExportComponent implements OnInit {
  @ViewChild('content') content: ElementRef;
  @Input() public planta: PlantaInterface;
  @Input() public informe: InformeInterface;
  @Input() public allPcs: PcInterface[];
  @Input() public allPcsConSeguidores: PcInterface[];


  public titulo: string;
  public irradianciaMinima: number;
  public url: string;
  public dataTipos: any;
  public dataSeveridad: any;
  public numCategorias;
  public numClases;
  public countCategoria;
  public countPosicion;
  public countClase;
  public mae;
  public global;
  public irradianciaImg$: Observable<string | null>;
  public suciedadImg$: Observable<string | null>;
  public portadaImg$: Observable<string | null>;
  public arrayFilas: Array<number>;
  public arrayColumnas: Array<number>;
  public tempReflejada: number;
  public emisividad: number;
  public tipoInforme: number;
  public pcListPorSeguidor: SeguidorInterface[];

  constructor(
    private storage: AngularFireStorage,
    private pcService: PcService
  ) {

    this.numCategorias = Array(GLOBAL.labels_tipos.length).fill(0).map( (_, i) => i + 1 );
    this.numClases = Array(GLOBAL.labels_severidad.length).fill(0).map( (_, i) => i + 1 );

    this.countCategoria = Array();
    this.countClase = Array();
    this.countPosicion = Array();
    this.global = GLOBAL;

    this.url = GLOBAL.url;
    this.titulo = 'Vista de informe';
    this.tipoInforme = 2;
  }

  ngOnInit() {
    // Ordenar Pcs por seguidor:
    this.pcListPorSeguidor = this.pcService.getPcsPorSeguidor(this.allPcsConSeguidores);
    for (const seguidor of this.pcListPorSeguidor) {
      this.setImgSeguidorCanvas(seguidor);
    }
    // this.setImgSeguidorCanvas(this.pcListPorSeguidor[0]);

    this.allPcs.sort(this.compare);
    this.irradianciaMinima = this.allPcs.sort(this.compareIrradiancia)[0].irradiancia;
    this.emisividad = this.allPcs[0].emisividad;
    this.tempReflejada = this.allPcs[0].temperaturaReflejada;

    this.arrayFilas = Array(this.planta.filas).fill(0).map( (_, i) => i + 1);
    this.arrayColumnas = Array(this.planta.columnas).fill(0).map( (_, i) => i + 1);

    this.irradianciaImg$ = this.storage.ref(`informes/${this.informe.id}/irradiancia.png`).getDownloadURL();
    this.suciedadImg$ = this.storage.ref(`informes/${this.informe.id}/suciedad.jpg`).getDownloadURL();
    this.portadaImg$ = this.storage.ref(`informes/${this.informe.id}/portada.jpg`).getDownloadURL();

    document.getElementById('imgIrradiancia').setAttribute('crossOrigin', 'anonymous');
    document.getElementById('imgPortada').setAttribute('crossOrigin', 'anonymous');
    document.getElementById('imgSuciedad').setAttribute('crossOrigin', 'anonymous');
    //

    // Calcular las perdidas y severidad(1 leve, 2 media, 3 grave, 4 muy grave)

    // Calcular las alturas
    for (const y of this.arrayFilas) {
      const countColumnas = Array();
      for (const x of this.arrayColumnas) {
        countColumnas.push(this.allPcs.filter( pc => pc.local_x === x && pc.local_y === y).length);
      }
      this.countPosicion.push(countColumnas);
    }

    // Calcular los tipos de puntos calientes
    let filtroCategoria;
    for (const i of this.numCategorias) {
      filtroCategoria = this.allPcs.filter( pc => pc.tipo === i && pc.severidad > 1);
      this.countCategoria.push(filtroCategoria.length);
    }

    // Calcular la severidad //
    let filtroClase;
    for (const j of this.numClases) {
      filtroClase = this.allPcs.filter( pc => pc.severidad === j);
      // console.log('j, filtroClase', j, filtroClase.length);
      this.countClase.push(filtroClase.length);
    }


    this.dataTipos = {
      labels: GLOBAL.labels_tipos,
      datasets: [
          {
              label: 'Tipos',
              backgroundColor: '#42A5F5',
              borderColor: '#1E88E5',
              data: this.countCategoria
          },
        ]
      };
    this.dataSeveridad = {
        labels: GLOBAL.labels_severidad,
        datasets: [
            {
                label: 'Severidad',
                backgroundColor: [
                  '#28a745',
                  '#FFCE56',
                  '#ff5722',
                  '#FF6384'
              ],
              hoverBackgroundColor: [
                '#28a745',
                  '#FFCE56',
            '#ff5722',
                  '#FF6384'
              ],
                data: this.countClase
            },
          ]
        };

  }
  public calificacionMae(mae: number) {
    if (mae <= 0.1) {
      return 'muy bueno';
    } else if (mae <= 0.2) {
      return 'correcto';
    } else {
      return 'mejorable';
    }
  }

  // Ordena los pcs por localizacion
  compare(a: PcInterface, b: PcInterface) {
    if (a.global_x < b.global_x) {
      return -1;
    }
    if (a.global_x > b.global_x) {
      return 1;
    }
    return 0;
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


  public downloadPDF() {
    const content = document.getElementById('pdfContent');
    const opt = {
      margin:       1,
      pagebreak: { mode: 'avoid-all'},
      filename:     'myfile.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(content.innerHTML).save();
  }

  private setImgSeguidorCanvas(seguidor: SeguidorInterface) {
    const imagenTermica = new Image();
    imagenTermica.crossOrigin = 'anonymous';

    seguidor.pcs[0].downloadUrl$
      .pipe(take(1))
      .subscribe( url => {
        seguidor.pcs[0].downloadUrlString = url;

        imagenTermica.src = url;

        const canvas = new fabric.Canvas(`imgSeguidorCanvas${seguidor.global_x}`);
        imagenTermica.onload = () => {
          canvas.setBackgroundImage(
            new fabric.Image(imagenTermica, {
              left: 0,
              top: 0,
              angle: 0,
              opacity: 1,
              draggable: false,
              lockMovementX: true,
              lockMovementY: true
            }),
            canvas.renderAll.bind(canvas),
            {
              // scaleX: this.canvas.width / image.width,
              // scaleY: this.canvas.height / image.height,
              crossOrigin: 'anonymous',
              left: 0,
              top: 0,
              // originX: 'top',
              // originY: 'left'
            }
          );
        };
      });
    }

    // imagenTermica.onload = () => {
    //   console.log('imagenTermica', imagenTermica.src);


}


