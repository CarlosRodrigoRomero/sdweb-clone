import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { GLOBAL } from '../../services/global';

import { PcService, SeguidorInterface } from '../../services/pc.service';

import { PcInterface } from '../../models/pc';
import { PlantaInterface } from '../../models/planta';
import { InformeInterface } from '../../models/informe';

import 'fabric';
declare let fabric;

import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

import { AngularFireStorage } from '@angular/fire/storage';
import { Observable, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatCheckboxChange } from '@angular/material';

declare var $: any;

@Component({
  selector: 'app-informe-export',
  templateUrl: './informe-export.component.html',
  styleUrls: ['./informe-export.component.css'],
  // providers: [InformeService, PlantaService, PcService]
})

export class InformeExportComponent implements OnInit {
  @ViewChild('content') content: ElementRef;
  @Input() public planta: PlantaInterface;
  @Input() public informe: InformeInterface;

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
  private filteredColumnasSource = new BehaviorSubject<any[]>(new Array<any>());
  public currentFilteredColumnas$ = this.filteredColumnasSource.asObservable();
  public pcDescripcion = GLOBAL.pcDescripcion;
  public filteredSeguidores$: Observable<SeguidorInterface[]>;
  public filteredSeguidoresVistaPrevia: SeguidorInterface[];
  public filteredPcsVistaPrevia: PcInterface[];
  public filteredPcs$: Observable<PcInterface[]>;
  public filteredPcs: PcInterface[];
  public countLoadedImages = 0;
  public countSeguidores: number;
  public generandoPDF = false;
  public isLocalhost: boolean;
  public doc = new jsPDF();

  private countLoadedImages$ = new BehaviorSubject(0);

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
    this.tipoInforme = '1';
    this.isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  }

  ngOnInit() {

    this.filteredSeguidores$ = this.pcService.filteredSeguidores$;
    this.filteredPcs$ = this.pcService.currentFilteredPcs$;
    this.pcColumnas = GLOBAL.pcColumnas;

    this.filtroColumnas = this.pcColumnas.map( (element) => element.nombre);
    this.filteredColumnasSource.next(this.pcColumnas);

    // Obtener pcs vista previa
    this.filteredPcs$.subscribe( pcs => {
      this.filteredPcsVistaPrevia = pcs.slice(0, 20);
    });
    // Ordenar Pcs por seguidor:
    this.pcService.filteredSeguidores$.subscribe( seguidores => {
      this.filteredSeguidores = seguidores;
      this.filteredSeguidoresVistaPrevia = seguidores.slice(0, 3);
    });


    ////////////////////////
    this.arrayFilas = Array(this.planta.filas).fill(0).map( (_, i) => i + 1);
    this.arrayColumnas = Array(this.planta.columnas).fill(0).map( (_, i) => i + 1);

    this.irradianciaImg$ = this.storage.ref(`informes/${this.informe.id}/irradiancia.png`).getDownloadURL();
    this.suciedadImg$ = this.storage.ref(`informes/${this.informe.id}/suciedad.jpg`).getDownloadURL();
    this.portadaImg$ = this.storage.ref(`informes/${this.informe.id}/portada.jpg`).getDownloadURL();
    this.logoImg$ = this.storage.ref(`informes/${this.informe.id}/logo.jpg`).getDownloadURL();



    // this.dataTipos = {
    //   labels: GLOBAL.labels_tipos,
    //   datasets: [
    //       {
    //           label: 'Tipos',
    //           backgroundColor: '#42A5F5',
    //           borderColor: '#1E88E5',
    //           data: this.countCategoria
    //       },
    //     ]
    //   };
    // this.dataSeveridad = {
    //     labels: GLOBAL.labels_severidad,
    //     datasets: [
    //         {
    //             label: 'Severidad',
    //             backgroundColor: [
    //               '#28a745',
    //               '#FFCE56',
    //               '#ff5722',
    //               '#FF6384'
    //           ],
    //           hoverBackgroundColor: [
    //             '#28a745',
    //               '#FFCE56',
    //         '#ff5722',
    //               '#FF6384'
    //           ],
    //             data: this.countClase
    //         },
    //       ]
    //     };

  }
  private calcularInforme(filteredPcs: PcInterface[]) {
    this.filteredPcs = filteredPcs;
    const allPcs = filteredPcs;
    allPcs.sort(this.compare);
    this.irradianciaMinima = allPcs.sort(this.compareIrradiancia)[0].irradiancia;
    this.emisividad = allPcs[0].emisividad;
    this.tempReflejada = allPcs[0].temperaturaReflejada;
    // Calcular las alturas
    for (const y of this.arrayFilas) {
      const countColumnas = Array();
      for (const x of this.arrayColumnas) {
        countColumnas.push(allPcs.filter(pc => pc.local_x === x && pc.local_y === y).length);
      }
      this.countPosicion.push(countColumnas);
    }
    // Calcular los tipos de puntos calientes
    let filtroCategoria;
    for (const i of this.numCategorias) {
      filtroCategoria = allPcs.filter(pc => pc.tipo === i && pc.severidad > 1);
      this.countCategoria.push(filtroCategoria.length);
    }
    // Calcular la severidad //
    let filtroClase;
    for (const j of this.numClases) {
      filtroClase = allPcs.filter(pc => pc.severidad === j);

      this.countClase.push(filtroClase.length);
    }
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

  public downloadPDF2() {
    console.log('filteredSeguidoresVistaPrevia', this.filteredSeguidoresVistaPrevia);
    let contador = 0;
    this.countSeguidores = 0;
    for (const seguidor of this.filteredSeguidoresVistaPrevia) {
      this.countSeguidores++;
      const c = $(`div[id="divSeguidorVP${seguidor.global_x}"]`)[0];
      console.log('seguidorCanvas', c);
      html2canvas(c, { scale: 1, useCORS: true }).then( canvas => {
        contador++;
        console.log('contador', contador, this.countSeguidores);

        const imgData = canvas.toDataURL(
          'image/png');
        const table = $(`table[id="tableSeguidorVP${seguidor.global_x}"]`)[0];
        this.doc.addImage(imgData, 'PNG', 10, 10);
        this.doc.autoTable({html: table});
        if (contador === this.countSeguidores ) {
          this.doc.save('table.pdf');
        }
          
      });
  
  }
}




  public downloadPDF() {
    this.generandoPDF = true;

    // GENERAR VISTA
    if (this.tipoInforme === '2') {
      this.countSeguidores = 0;
      for (const seguidor of this.filteredSeguidores) {
        this.setImgSeguidorCanvas(seguidor, false);
        this.countSeguidores++;
        // if ( count === 5 ) {
        //   break;
        // }
      }
    }
    // document.getElementById('imgIrradiancia').setAttribute('crossOrigin', 'anonymous');
    // document.getElementById('imgPortada').setAttribute('crossOrigin', 'anonymous');
    // document.getElementById('imgSuciedad').setAttribute('crossOrigin', 'anonymous');
    // document.getElementById('imgLogo').setAttribute('crossOrigin', 'anonymous');
    // // document.getElementById('imgCalibracion').setAttribute('crossOrigin', 'anonymous');
    // // document.getElementById('imgCompra').setAttribute('crossOrigin', 'anonymous');

    // Calcular informe
    this.pcService.currentFilteredPcs$.pipe(
      take(1)
    )
    .subscribe( filteredPcs => {
      this.calcularInforme(filteredPcs);
    });

    this.countLoadedImages$.subscribe( n => {
      // console.log('subscription', n, this.countSeguidores);
      if ( n === this.countSeguidores || this.tipoInforme === '1') {
        setTimeout( () => {
          const content = document.getElementById('pdfContent');
          const opt = {
            margin:       20,
            pagebreak: { mode: 'avoid-all' },
            filename:     'informe.pdf',
            image:        { type: 'jpeg', quality: 1 },
            html2canvas:  { scale: 1, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          html2pdf().set(opt).from(content.innerHTML).save();
          this.generandoPDF = false;
        }, 2000);
      }
    });

  }

  private setImgSeguidorCanvas(seguidor: SeguidorInterface, vistaPrevia: boolean = false) {
    const imagenTermica = new Image();
    imagenTermica.crossOrigin = 'anonymous';

    const seguidorObs = this.storage.ref(`informes/${this.informe.id}/jpg/${seguidor.pcs[0].archivoPublico}`).getDownloadURL();

    seguidorObs
      .pipe(take(1))
      .subscribe( url => {
        seguidor.pcs[0].downloadUrlString = url;
        let canvas = new fabric.Canvas(`imgSeguidorCanvas${seguidor.global_x}`);

        if (vistaPrevia) {
          canvas = new fabric.Canvas(`imgSeguidorCanvasVP${seguidor.global_x}`);
        }

        imagenTermica.onload = () => {
          if (!vistaPrevia) {
            this.countLoadedImages++;
            this.countLoadedImages$.next(this.countLoadedImages);
          }

          const fabricImage = new fabric.Image(imagenTermica, {
              left: 0,
              top: 0,
              angle: 0,
              opacity: 1,
              scaleX: 1,
              scaleY: 1,
              draggable: false,
              lockMovementX: true,
              lockMovementY: true
            });

          // fabricImage.scale(1);
          canvas.add(fabricImage);
          this.drawAllPcsInCanvas(seguidor, canvas, vistaPrevia);
            // canvas.renderAll.bind(canvas),
            // {
              // scaleX: this.canvas.width / image.width,
              // scaleY: this.canvas.height / image.height,
              // crossOrigin: 'anonymous',
              // left: 0,
              // top: 0,
              // originX: 'top',
              // originY: 'left'
            // }
        };
        imagenTermica.src = url;

      });
    }

  drawAllPcsInCanvas(seguidor: SeguidorInterface, canvas, vistaPrevia: boolean = false) {
    seguidor.pcs.forEach( (pc, i, a) => {
      this.drawPc(pc, canvas);
      this.drawTriangle(pc, canvas);
    });

    canvas.getElement().toBlob( (blob) => {
      // console.log('blob', blob);
      const urlCreator = window.URL;
      const imageUrl = urlCreator.createObjectURL(blob);
      const image = new Image();
      image.src = imageUrl;
      image.width = 640;
      image.height = 512;
      let list = document.getElementById(`divSeguidor${seguidor.global_x}`);
      if (vistaPrevia) {
        list = document.getElementById(`divSeguidorVP${seguidor.global_x}`);
      }
      // list.removeChild(list[0]);
      list.appendChild(image);
    },
    'image/jpeg',
    0.95 // calidad
    );
  }

  drawPc(pc: PcInterface, canvas: any) {
    const actObj1 = new fabric.Rect({
      left: pc.img_left,
      top: pc.img_top,
      fill: 'rgba(0,0,0,0)',
        stroke: 'black',
        strokeWidth: 1,
        width: pc.img_width,
        height: pc.img_height,
        hasControls: false,
        lockMovementY: true,
        lockMovementX: true,
        localId: pc.local_id,
        ref: false,
        selectable: false,
        hoverCursor: 'default'
    });
    const actObj2 = new fabric.Rect({
      left: pc.img_left - 1,
      top: pc.img_top - 1,
      fill: 'rgba(0,0,0,0)',
      stroke: 'red',
      strokeWidth: 1,
      width: pc.img_width + 2,
      height: pc.img_height + 2,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      localId: pc.local_id,
      ref: false,
      hoverCursor: 'pointer',
      selectable: true
    });
    const textId = new fabric.Text(
      '#'.concat(pc.local_id.toString().concat(' ')), {
        left: pc.img_left,
        top: pc.img_top - 26,
        fontSize: 20,
        // textBackgroundColor: 'red',
        ref: 'text',
        selectable: false,
        hoverCursor: 'default',
        fill: 'white'
    });

    canvas.add(actObj1);
    canvas.add(actObj2);
    canvas.add(textId);
    canvas.renderAll();
  }

  private drawTriangle(pc: PcInterface, canvas: any) {
    const x = pc.img_x;
    const y = pc.img_y;

    const squareBase = 12;
    const triangle = new fabric.Triangle({
      width: squareBase,
      height: squareBase,
      fill: 'red',
      stroke: 'black',
    left: Math.round(x - squareBase / 2),
    top: y, // si no ponemos este 2, entonces no lee bien debajo del triangulo
    selectable: false,
    ref: 'triangle',
    hoverCursor: 'default',
  });

    const textTriangle = new fabric.Text(
      ' + '.concat(pc.gradienteNormalizado.toString().concat(' ºC ')), {
        left: pc.img_left,
        top: pc.img_top + pc.img_height + 5,
        fontSize: 22,
        textBackgroundColor: 'white',
        ref: 'text',
        selectable: false,
        hoverCursor: 'default',
        fill: 'red',
      });

    canvas.add(triangle);
    canvas.add(textTriangle);
    canvas.renderAll();
  }

  onCheckBoxColumnaChange($event: MatCheckboxChange) {
    const columnaChecked = $event.source.value;
    this.filtroColumnas = this.filtroColumnas.filter(nombre => nombre !== columnaChecked);
    if ($event.checked === true) {
      this.filtroColumnas.push(columnaChecked);
    }

    // Llamar al behaviourObject
    this.filteredColumnasSource.next(
      this.pcColumnas.filter( e => this.filtroColumnas.includes(e.nombre))
      );
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
}


