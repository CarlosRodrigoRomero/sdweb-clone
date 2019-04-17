import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { GLOBAL } from '../../services/global';

import { PcService, SeguidorInterface } from '../../services/pc.service';

import { PcInterface } from '../../models/pc';
import { PlantaInterface } from '../../models/planta';
import { InformeInterface } from '../../models/informe';

import 'fabric';
declare let fabric;

import Pica from 'pica';
const pica = Pica();
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

import { AngularFireStorage } from '@angular/fire/storage';
import { Observable, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatCheckboxChange } from '@angular/material';

import pdfMake from 'pdfmake/build/pdfmake.js';
import  pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { DatePipe, DecimalPipe } from '@angular/common';

pdfMake.vfs = pdfFonts.pdfMake.vfs;
declare var $: any;

@Component({
  selector: 'app-informe-export',
  templateUrl: './informe-export.component.html',
  styleUrls: ['./informe-export.component.css'],
  providers: [ DatePipe, DecimalPipe]
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
  public doc: jsPDF;
  public imageList = {};
  public pages;
  public irradianciaImgBase64: string;
  public portadaImgBase64: string;
  public imgSuciedadBase64: string;
  public imgFormulaMaeBase64: string;
  public imgCurvaMaeBase64: string;

  private countLoadedImages$ = new BehaviorSubject(null);

  constructor(
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
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
    
    this.irradianciaImg$.pipe(take(1)).subscribe( url => {
      const htmlImage = new Image();
      htmlImage.src = url;
      htmlImage.crossOrigin = 'anonymous';
      const canvas = document.getElementById('irradianciaImg')  as HTMLCanvasElement;
      
      htmlImage.onload = () => {
        pica.resize(htmlImage, canvas).then( result => {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(result, 0 , 0);
          this.irradianciaImgBase64 = canvas.toDataURL('image/jpeg', 0.85)
        });
      }
    });

    this.portadaImg$.pipe(take(1)).subscribe( url => {
      const htmlImage = new Image();
      htmlImage.src = url;
      htmlImage.crossOrigin = 'anonymous';
      const canvas = document.getElementById('portadaImg')  as HTMLCanvasElement;

      htmlImage.onload = () => {
        pica.resize(htmlImage, canvas).then( result => {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(result, 0 , 0);
          this.portadaImgBase64 = canvas.toDataURL('image/jpeg', 0.85)
        });
      }
    });

    this.suciedadImg$.pipe(take(1)).subscribe( url => {
      const htmlImage = new Image();
      htmlImage.src = url;
      htmlImage.crossOrigin = 'anonymous';
      const canvas = document.getElementById('imgSuciedad')  as HTMLCanvasElement;

      htmlImage.onload = () => {
        pica.resize(htmlImage, canvas).then( result => {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(result, 0 , 0);
          this.imgSuciedadBase64 = canvas.toDataURL('image/jpeg', 0.85)
        });
      }
    });

    const imgCurvaMae = new Image();
    imgCurvaMae.src = '../../../assets/images/maeCurva.png'
    imgCurvaMae.crossOrigin = 'anonymous';
    const canvas = document.getElementById('imgCurvaMae')  as HTMLCanvasElement;
    
    imgCurvaMae.onload = () => {
      pica.resize(imgCurvaMae, canvas).then( result => {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(result, 0 , 0);
        this.imgCurvaMaeBase64 = canvas.toDataURL('image/jpeg', 0.85)
      });
    };




    






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
    this.emisividad = this.informe.emisividad;
    this.tempReflejada = this.informe.tempReflejada;
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

  private generateIntroPDF() {
    const specialElementHandlers = {
      'img': (element, renderer) => {
          return false;
      }
  };
    this.doc.fromHTML(
      $('#newPdf').get(0),
      15,
      15,
      {
        'width': 170,
        'elementHandlers': specialElementHandlers },
      (cb) => { this.doc.save('intro.pdf') }
    );
    
    this.generandoPDF = false;
  }

  public downloadPDF6() {
    this.generandoPDF = true;

    this.pcService.currentFilteredPcs$.pipe(
      take(1)
    )
    .subscribe( filteredPcs => {
      this.calcularInforme(filteredPcs);

      const pdfDocGenerator = pdfMake.createPdf(this.getDocDefinition());

      pdfDocGenerator.getDataUrl((dataUrl) => {
          const iframe = document.createElement('iframe');
          iframe.src = dataUrl;
          iframe.setAttribute('style', 'position:absolute;right:0; top:0; bottom:0; height:100%; width:650px; padding:20px;');
          document.getElementById('vistaPrevia').appendChild(iframe);
      });
      this.generandoPDF = false;
    });

  }

  public downloadPDF5() {



    this.generandoPDF = true;
    let content_ = [];

    this.countLoadedImages$.subscribe( global_x => {
      console.log('glboal_x', global_x);
      if (global_x !== null) {
        console.log('global_x', global_x, 100 * this.countLoadedImages/this.countSeguidores, '%');

        const canvas = $(`canvas[id="imgSeguidorCanvas${global_x}"]`)[0];
        
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
        this.imageList[global_x.toString()] = imageBase64;
        content_.push({ image: imageBase64, width: 500});
        // console.log('imageBase64', imageBase64 );

        // Añadir a dd



        if (this.countLoadedImages === this.countSeguidores) {
          const dd = {
            content:content_,
            images: this.imageList
          }


          pdfMake.createPdf(dd).download();
          this.generandoPDF = false;
        }
      }

    });
    // Generar imagenes
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
  }



  public downloadPDF4() { // Intro
    this.generandoPDF = true;
    this.doc = new jsPDF();
    this.doc.setFontSize(10);
    this.generateIntroPDF();

 
  }
  public downloadPDF3() {
    this.generandoPDF = true;
    this.doc = new jsPDF();
    this.doc.setFontSize(10);

    this.countLoadedImages$.subscribe( global_x => {
      if (global_x !== null) {
        const canvas = $(`canvas[id="imgSeguidorCanvas${global_x}"]`)[0];
  
        const imgData = canvas.toDataURL('image/png');
        const table = $(`table[id="tableSeguidor${global_x}"]`)[0];
        this.doc.addImage(imgData, 'PNG', 10, 10);
        this.doc.autoTable({
          html: table,
          startY: 150,
        });
        this.doc.addPage();
          
        if (this.countLoadedImages === this.countSeguidores) {
          this.doc.save('table.pdf');
          this.generandoPDF = false;
        }
      }

    });
    // Generar imagenes
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
  }

  public downloadPDF2() {
    this.generandoPDF = true;

    let contador = 0;
    this.doc = new jsPDF();
    this.doc.setFontSize(12);

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
        this.doc.autoTable({
          html: table,
          startY: 150,
        });
        this.doc.addPage();
        if (contador === this.countSeguidores ) {
          this.doc.save('table.pdf');
          this.generandoPDF = false;
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
  
    // Calcular informe
    this.pcService.currentFilteredPcs$.pipe(
      take(1)
    )
    .subscribe( filteredPcs => {
      this.calcularInforme(filteredPcs);
    });

    this.countLoadedImages$.subscribe( n => {

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
        imagenTermica.src = url;
        let canvas = new fabric.Canvas(`imgSeguidorCanvas${seguidor.global_x}`);

        if (vistaPrevia) {
          canvas = new fabric.Canvas(`imgSeguidorCanvasVP${seguidor.global_x}`);
        }

        imagenTermica.onload = () => {
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

          if (!vistaPrevia) {
            this.countLoadedImages++;
            this.countLoadedImages$.next(seguidor.global_x);
          }
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
        

      });
    }

  drawAllPcsInCanvas(seguidor: SeguidorInterface, canvas, vistaPrevia: boolean = false) {
    seguidor.pcs.forEach( (pc, i, a) => {
      this.drawPc(pc, canvas);
      this.drawTriangle(pc, canvas);
    });
       // canvas.getElement().toBlob( (blob) => {

      
    //   const urlCreator = window.URL;
    //   const imageUrl = urlCreator.createObjectURL(blob);
    //   const image = new Image();
    //   image.src = imageUrl;
    //   image.width = 640;
    //   image.height = 512;
    //   const list = document.getElementById(`divSeguidorVP${seguidor.global_x}`);

    //   // list.removeChild(list[0]);
    //   list.appendChild(image);
    // },
    // 'image/jpeg',
    // 0.95 // calidad
    // );
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





//  ###################  CONTENIDO ##################################



getTablaCategoria() {
  let array = [];
  for (let i of this.numCategorias) {
      if (this.countCategoria[i-1] > 0) {
          array.push(new Array(

              {
                  text: this.global.pcDescripcion[i]
              }, {
                  text: this.countCategoria[i-1]
              }, {
                  text: this.decimalPipe.transform(this.countCategoria[i-1] / this.filteredPcs.length * 100, '1.0-1').toString() + ' %'
              }));
      }

  }

  return array;
};



getTablaPosicion = function() {
  let array = [];
  let arrayHeader = [];
  arrayHeader.push({});

  for (let i of this.arrayColumnas) {

      arrayHeader.push({
          text: i.toString(),
          style: 'tableHeader'
      })

  };
  array.push(arrayHeader);

  for (let j of this.arrayFilas) {
      let arrayFila = [];
      arrayFila.push({
          text: j.toString(),
          style: 'tableHeader'
      });
      const countPosicionFila = this.countPosicion[j - 1];
      for (let i of this.arrayColumnas) {

          arrayFila.push({
                  text: countPosicionFila[i - 1].toString(),
                  style: 'tableCell'
              }

          );


      };

      array.push(arrayFila);
  };

  return array;
}



getTextoIrradiancia() {
  if (this.informe.irradiancia === 0) {
      return `Los datos de irradiancia durante el vuelo han sido obtenidos de la estación meteorológica de la propia planta de ${this.planta.nombre}, los cuales han sido suministrados a nuestro software para ser emparejados con las imágenes termográficas tomadas desde el aire, de manera que cada imagen tiene una irradiancia asociada. Dicha irradiancia es la más cercana en el tiempo de las registradas.`;
  } else {
      return 'Los datos de irradiancia durante el vuelo han sido obtenidos de los instrumentos de medición que Solardrone ha llevado a planta, los cuales han sido suministrados a nuestro software para ser emparejados con las imágenes termográficas tomadas desde el aire, de manera que cada imagen tiene una irradiancia asociada. Dicha irradiancia es la más cercana en el tiempo de las registradas.';
  }
};

getTextoLocalizar() {
  if (this.planta.tipo === '2 ejes') {
      return 'Además todos ellos tienen asociado los parámetros seguidor”, “fila” y “columna” según el mapa habitual de la planta. Las filas y las columnas tienen origen en la esquina superior izquierda del seguidor.';
  } else {
      return 'Además todos ellos tienen asociado los parámetros "pasillo", "columna" y "altura" según el mapa habitual de la planta.';
  }
};


getPagesPDF() {
  return [

  {
      text: 'Análisis termográfico aéreo de módulos fotovoltaicos',
      style: 'h1',
      alignment: 'center'
  },

  '\n',

  {
     image: 'imgPortada',
    width: 600,
   alignment: 'center'
  },

  '\n\n',

  {
      text: [{
              text: `Planta solar: `,
              style: 'bold'
          },
          `${this.planta.nombre} (${this.planta.potencia} MW - ${this.planta.tipo})`
      ],
      style: 'subtitulo',
  },

  {
      text: [{
              text: `Fecha del vuelo: `,
              style: 'bold'
          },
          this.datePipe.transform(this.informe.fecha * 1000, 'dd/mm/yyyy'),
      ],
      style: 'subtitulo',
      pageBreak: 'after'
  },

  {
      text: '1. Introducción',
      style: 'h2'
  },

  '\n',

  {
      text: `Este documento contiene los resultados de la inspección termográfica realizada en la planta solar fotovoltaica de ${this.planta.nombre} de ${this.planta.potencia} MW (${this.planta.tipo}).`,
      style: 'p'
  },

  '\n',

  {
      text: 'Las inspecciones termográficas en instalaciones solares fotovoltaicas forman parte del mantenimiento preventivo recomendado para este tipo de instalaciones y tienen como objetivo anticiparse a aquellos problemas en los paneles que no son detectables fácilmente de otra manera.',
      style: 'p'
  },

  '\n',

  {
      text: 'Es importante que este mantenimiento sea llevado a cabo por profesionales, ya que una termografía mal realizada durante varios años puede afectar al estado general de la planta.',
      style: 'p'
  },

  '\n',

  {
      text: 'Entre las ventajas de realizar termografía infrarroja de manera regular: permite aumentar la eficiencia de la planta (performance ratio) en el medio plazo, evitar reparaciones más costosas, aumentar la vida útil de los equipos, detectar problemas relacionados con distintos fabricantes de paneles, problemas de conexión entre módulos, problemas relacionados con la vegetación o la suciedad en los módulos... entre una larga lista de ventajas.',
      style: 'p'
  },

  '\n',

  {
      text: 'La inspección ha sido realizada mediante vehículos aéreos no tripulados operados y diseñados a tal efecto por Solardrone. Se ha utilizado la más avanzada tecnología al servicio de la fotovoltaica con el fin de reducir al mínimo el tiempo y el coste de operación sin renunciar a la más alta calidad y fiabilidad.  El equipo de que ha realizado el presente documento cuenta con personal formado en Termografía Infrarroja Nivel 1 y lleva realizando termografías aéreas desde 2015, habiendo volado más de 500 MW.',
      style: 'p'
  },

  '\n\n',

  {
      text: '1.1 Criterio de operación',
      style: 'h2',
  },

  '\n',


  {
      text: 'El criterio base que Solardrone sigue para realizar inspecciones termográficas es la norma internacional para inspecciones termográficas IEC 62446-3. En la misma se define las termografías infrarrojas de módulos fotovoltaicos en plantas durante su operación',
      style: 'p'
  },

  '\n',

  {
      text: 'Hay dos niveles de inspección termográfica según la norma IEC 62446-3:',
      style: 'p'
  },

  '\n',


  {
      ul: [{
          text: [{
                  text: 'Inspección simplificada',
                  bold: true
              },
              ': Esta es una inspección limitada para verificar que los módulos están funcionando, con requisitos reducidos para el personal. Este tipo de inspecciones se usan, por ejemplo, durante una puesta en marcha básica de una planta fotovoltaica.\n\n'
          ]
      }, {
          text: [{
                  text: 'Inspección detallada',
                  bold: true
              },
              ': Requiere una comprensión más profunda de las anomalías térmicas. Puede ser utilizado para inspecciones periódicas de acuerdo con a la serie IEC 62446 y para solucionar problemas en sistemas con un bajo rendimiento. Se realizan mediciones de temperatura absoluta. Un experto autorizado en plantas fotovoltaicas, junto con exportos termógrafos, pueden llevar a cabo este tipo de inspecciones.'
          ]
      }],
  },

  '\n',


  {
      text: 'Las termografías realizadas por Solardrone entran dentro de las inspecciones detalladas indicadas por la norma, cumpliendo con los requisitos que indica la misma, que son:',
      style: 'p'
  },

  '\n',

  {
      ul: [
          'Medición absoluta de temperaturas: con un error menor de 2 ºC',
          'Medición de temperatura máxima, media y gradiente.',
          'Informe realizado por un experto en termografía infrarroja en conjunto con un experto en fotovoltaica.',
          'Recomendación para cada tipo de anomalía registrada.',
          'Resolución geométrica térmica: 5x5 pixels por cada célula fotovoltaica',
          'Resolución geométrica visual: 25x25 pixels por cada célula fotovoltaica',
          'Condiciones ambientales correctas: temperatura ambiente, viento, nubosidad e irradiancia',
          'Calibración de los equipos: cada 2 años',
          'Parámetros térmicos: el ajuste de la emisividad y la temperatura reflejada es imprescindible para una correcta medición de las temperaturas. Es necesario hacer las mediciones oportunas en campo para poder obtener estos parámetros, ya que dependen de la atmósfera, la meteorología, la suciedad en los módulos el día del vuelo y de los materiales del propio módulo.',
          'Documentación: el entregable incluye las imágenes radiométricas y visuales originales junto con todos los datos que requiere la norma. ',
          'Trayectoria: que asegure el cumplimiento de la norma.',
          'Velocidad: 10 km/h máximo.',
      ],
  },

  {
      text: '\n\n'
  },

  {
      text: '1.1 Normalización de gradientes de temperatura',
      style: 'h3'
  },

  '\n',

  {
      text: [
          'Con el fin de poder ver la ', {
              text: 'evolución de las anomalías térmicas con el tiempo',
              style: 'bold'
          },
          'comparando inspecciones termográficas llevadas a cabo en distintos meses o años (con condiciones ambientales distintas), es necesario contar con un procedimiento que permita normalizar los gradientes de temperatura.',

      ],
      style: 'p'
  },

  '\n',

  {
      text: 'Por este motivo todas las anomalías registradas tienen asociada su "gradiente normalizado", que es el gradiente de temperatura equivalente a haber realizado la inspección con una irradiancia de 1000 W/m2. Esto permitirá poder comparar los resultados de la presente inspección con otras futuras realizadas en condiciones ambientales diferentes y así poder tener una evolución fidedigna de cada una de las anomalías.',
      style: 'p'
  },

  '\n\n',

  {
      text: '1.2 Datos del vuelo',
      style: 'h3'
  },

  '\n',

  {
      text: 'Las condiciones durante le vuelo han sido las siguientes:',
      style: 'p'

  },

  '\n',

  {
      columns: [

          {
              width: '*',
              text: ''
          },

          {
              width: 'auto',
              table: {
                  body: [
                      [{
                          text: 'Vehículo aéreo no tripulado',
                          style: 'tableHeader',
                          colSpan: 2,
                          alignment: 'center'
                      }, {}],
                      [{
                          text: 'Aeronave',
                          style: 'tableLeft'
                      }, {
                          text: `${this.global.uav}`
                      }],
                      [{
                          text: 'Cámara térmica',
                          style: 'tableLeft'
                      }, {
                          text: `${this.global.camaraTermica}`
                      }],
                      [{
                          text: 'Última calibración',
                          style: 'tableLeft'
                      }, {
                          text: `${this.global.ultimaCalibracion}`
                      }],

                      [{
                          text: 'Datos del vuelo',
                          style: 'tableHeader',
                          colSpan: 2,
                          alignment: 'center'
                      }, {}],

                      [{
                          text: 'Fecha',
                          style: 'tableLeft'
                      }, {
                          text: this.datePipe.transform(this.informe.fecha * 1000 , 'dd/MM/yyyy')
                      }],

                      [{
                          text: 'Horario de los vuelos',
                          style: 'tableLeft'
                      }, {
                          text: `${this.informe.hora_inicio} - ${this.informe.hora_fin}`
                      }],

                      [{
                          text: 'Velocidad',
                          style: 'tableLeft'
                      }, {
                          text: `${this.informe.velocidad} km/h`
                      }],

                      [{
                          text: 'GSD térmico (medio)',
                          style: 'tableLeft'
                      }, {
                          text: `${this.informe.gsd} cm/pixel`
                      }],

                      [{
                          text: 'GSD visual',
                          style: 'tableLeft'
                      }, {
                          text: `${this.informe.gsd / 0.16 } cm/pixel`
                      }],

                      [{
                          text: 'Datos meteorológicos',
                          style: 'tableHeader',
                          colSpan: 2,
                          alignment: 'center'
                      }, {}],

                      [{
                          text: 'Irradiancia (mínima)',
                          style: 'tableLeft'
                      }, {
                          text: `${this.irradianciaMinima} W/m2`
                      }],

                      [{
                          text: 'Temperatura ambiente',
                          style: 'tableLeft'
                      }, {
                          text: `${this.informe.temperatura} ºC`
                      }],

                      [{
                          text: 'Nubosidad',
                          style: 'tableLeft'
                      }, {
                          text: `${this.informe.nubosidad} okta`
                      }],



                  ]
              }
          },

          {
              width: '*',
              text: ''
          },

      ]

  },

  '\n',


  {
      text: '1.3 Irradiancia durante el vuelo\n\n',
      style: 'h3'
  },

  {
      text: this.getTextoIrradiancia(),
      style: 'p'
  },

  '\n',

  {
    image: 'imagenIrradiancia',
    width: 500,
    alignment: 'center'
  },

  '\n\n',

  {
      text: '1.4 Ajuste de parámetros térmicos',
      style: 'h3'
  },

  '\n',

  {
      text: [
          'Con el fin de obtener medidas de temperaturas absolutas fiables, es necesario tener en cuenta distintas variables térmicas que afectan directamente al resultado de las medidas obtenidas por las cámaras. Las más importantes son ', {
              text: 'la emisividad',
              style: 'bold'
          },
          ' y la ', {
              text: 'temperatura reflejada',
              style: 'bold'
          },
          '.'
      ],
      style: 'p'
  },

  '\n',

  {
      text: '1.4.1 Emisividad',
      style: 'h4'
  },

  '\n',

  {
      text: 'La emisividad del material se mide de manera experimental en campoy y depende del tipo de vidrio de los módulos y de la suciedad que presenten el día del vuelo. La emisividad escogida por el termógrafo tras el ensayo experimental es la siguiente:',
      style: 'p'
  },

  '\n',

  {
      text: 'Emisividad = ' + this.informe.emisividad.toString(),
      style: 'param'
  },

  '\n',

  // Imagen suciedad
  {
    image: 'imgSuciedad',
    width: 500,
    alignment: 'center'
  },
  {
      text: '1.4.2 Temperatura reflejada',
      style: 'h4'
  },

  '\n',

  {
      text: 'La temperatura reflejada nos depende de la atmosfera y las condiciones meteorológicas del día del vuelo. Para obtener este parámetro es necesario llevar a cabo un procedimiento de medición adecuado en la misma planta el mismo día del vuelo. La temperatura reflejada medida es:',
      style: 'p'
  },

  '\n',

  {
      text: 'Temperatura reflejada = ' + this.informe.tempReflejada.toString() + ' ºC',
      style: 'param'
  },

  '\n\n',

  {
      text: '1.5 Pérdida de Performance Ratio (ΔPR)',
      style: 'h3'
  },

  '\n',

  {
      text: 'El coeficiente de rendimiento de sistemas fotovoltaicos o Performance Ratio es un parámetro que tuvo su origen conceptual en la norma IES 61724 (1998) para ser utilizado como indicador de calidad en la evaluación de sistemas fotovoltaicos.\n\n',
      style: 'p'
  },

  {
      text: 'Este parámetro se utiliza para medir el rendimiento de cualquier sistema fotovoltaico. En otras palabras, si queremos saber si un módulo está generando la energía que debería bastaría con conocer su PR. No podemos conocer el PR de cada módulo con una termografía, pero lo que sí podemos conocer es la pérdida de PR (ΔPR) producida por anomalía térmica respecto a sus condiciones ideales. Es decir, un módulo con un punto caliente que causa una ΔPR = -1% tiene menos importancia que una anomalía que causa una ΔPR = -33%, el cual está haciendo caer la producción eléctrica del módulo en un 33%.',
      style: 'p'
  },

  '\n',

  {
      text: 'La pérdida de PR nos indica, por tanto, lo perjudicial que es una anomalía térmica, identificando explícitamente los puntos sobre los que se debe actuar para optimizar la producción eléctrica. Es un parámetro indispensable en el diagnóstico termográfico de una instalación fotovoltaica, ya que nos permite tomar decisiones en base a un dato técnico-económico objetivo.',
      style: 'p'
  },

  '\n',

  {
      text: 'Para poder evaluar la planta utilizaremos los siguientes dos sencillos conceptos:',
      style: 'p'
  },

  '\n',

  {
      text: 'Pérdidas de performance ratio (ΔPR)',
      style: 'h5'
  },

  '\n',

  {
      text: 'Cada incidencia tiene una variación de performance ratio asociado. Por ejemplo, un diodo bypass en circuito abierto produce que el módulo trabaje al 15% de eficiencia en un caso típico (ΔPR=85%), mientras que una célula caliente aislada produce de media < 1% de pérdidas.',
      style: 'p'
  },

  '\n',

  {
      text: 'Módulos apagados equivalentes',
      style: 'h5'
  },

  '\n',

  {
      text: 'El concepto “módulos apagados equivalentes” es la cantidad equivalente de módulos que no generan energía debido a las incidencias registradas en la planta. Por ejemplo, si tenemos tres módulos idénticos con un defecto en un diodo bypass cada uno, cada módulo genera un 33% menos de energía. Entonces, el número de módulos apagados equivalentes es 1.',
      style: 'p'
  },

  {
      text: 'Uniendo los dos conceptos anteriores, se puede hacer una estimación “grosso modo” de la variación de PR de la planta de la siguiente manera:',
      style: 'p'
  },

  {
    image: 'imgFormulaMae',
    width: 400,
    alignment: 'center'
  },

  {
      text: 'Siendo N = Número de módulos; PR = Performance ratio; MAE = Módulos apagados equivalente calculados\n\n',
      style: 'pieFoto'
  },

  {
      text: 'Por lo tanto, sabiendo el MAE sabremos cuánto PR estamos perdiendo debido a las incidencias encontradas.\n\n',
      style: 'p'
  },

  {
      text: 'El objetivo será obtener un MAE bajo, lo cual nos indicará un correcto mantenimiento de la planta.\n\n',
      style: 'p'
  },

  {
      text: 'Teniendo en cuenta todas las plantas fotovoltaicas inspeccionadas por Solardrone, se puede hacer una clasificación estadística según el MAE. Según la siguiente tabla, podemos clasificar el mantenimiento de una planta en 3 tipos: muy bueno (por debajo de la media), correcto (en la media) y "mejorable" (por encima de la media):\n\n',
      style: 'p'

  },

  // Imagen maeCurva
  {
    image: 'imgCurvaMae',
    width: 400,
    alignment: 'center'
  },

  {
      columns: [

          {
              width: '*',
              text: ''
          },

          {
              width: 'auto',
              table: {
                  body: [
                      [{
                          text: 'MAE de la planta',
                          style: 'tableHeader',

                      }, {
                          text: 'Estado',
                          style: 'tableHeader',

                      }],
                      [{
                          text: '% MAE < ' + this.global.mae[0],
                          style: ['mae1', 'bold']
                      }, {
                          text: 'Muy bueno',
                          style: 'mae1'
                      }],
                      [{
                          text: this.global.mae[0].toString() + ' < % MAE <  ' + this.global.mae[1].toString(),
                          style: ['mae2', 'bold']
                      }, {
                          text: 'Correcto',
                          style: 'mae2'
                      }],
                      [{
                          text: '% MAE > 0.2',
                          style: ['mae3', 'bold']
                      }, {
                          text: 'Mejorable',
                          style: 'mae3'
                      }],
                  ]
              }
          },

          {
              width: '*',
              text: ''
          },
      ]
  },

  '\n\n',

  {
      text: '1.6 Clasificación de las anomalías',
      style: 'h3'
  },

  '\n',

  {
      text: 'Según la norma UNE-62446-3 de inspección termográfica de instalaciones fotovoltaicas, las anomalías termográficas se clasifican en tres clases o CoA (Class of Abnormalitys):\n\n',
      style: 'p'
  },

  {
      ul: [{
              text: [

                  {
                      text: 'CoA 1 - sin anomalía',
                      style: ['coa1', 'bold']
                  },
                  ': hacemos seguimiento, pero no hay que actuar.',
              ]
          }, {
              text: [

                  {
                      text: 'CoA 2 - anomalía térmica',
                      style: ['coa2', 'bold']
                  },
                  ': ver la causa y, si es necesario, arreglar en un periodo razonable.',
              ]
          }, {
              text: [

                  {
                      text: 'CoA 3 - anomalía térmica relevante para la seguridad',
                      style: ['coa3', 'bold']
                  },
                  ': próxima interrupción de la operación normal del módulo, detectar la causa y rectificar en un periodo razonable.',
              ]
          },

      ],
  },

  '\n\n',


  {
      text: '1.7 Cómo localizar las anomalías',
      style: 'h3'
  },

  '\n',

  {
      text: 'Todas las incidencias tienen asociada una localización GPS, cuyo margen de error es de unos pocos metros (0-2 metros).',
      style: 'p'
  },

  '\n',

  {

      text: this.getTextoLocalizar(),
      style: 'p'
  },

  '\n\n',

  {
      text: '2 Resultados de la inspección termográfica',
      style: 'h2'
  },

  '\n',

  {
      text: '2.1 Resultados por clase de anomalía (CoA)',
      style: 'h3'
  },

  '\n',

  {
      text: 'A continuación se detallan la cantidad de incidencias registradas según su clase (1, 2 ó 3).',
      style: 'p'
  },

  {
      text: [
      `Se han registrado un total de `,
      {text: this.countClase[1] + this.countClase[2] ,style: 'bold'},
      ` anomalías térmicas, de las cuales ${this.countClase[1]} son de clase 2 y ${this.countClase[2]} son de clase 3.`,     
      ],
      style: 'p'
  },

  '\n',

  {
      text: '2.2 Resultados por categoría de la anomalía',
      style: 'h3'
  },

  '\n',

  {
      text: 'La siguiente tabla muestra la cantidad de anomalías térmicas por categoría. Sólo se incluyen las anomalías térmicas de clase 2 y 3.',
      style: 'p'
  },

  '\n',

  {
      columns: [

          {
              width: '*',
              text: ''
          }, {
              width: 'auto',
              table: {
                  body: [
                      [{
                              text: 'Categoría',
                              style: 'tableHeader',

                          },

                          {
                              text: 'Cantidad',
                              style: 'tableHeader',
                          },

                          {
                              text: 'Porcentaje %',
                              style: 'tableHeader',
                          }
                      ]
                  ].concat(this.getTablaCategoria()).concat(
                      [
                          [{
                              text: 'TOTAL',
                              style: 'bold'
                          }, {
                              text: this.countClase[1] + this.countClase[2],
                              style: 'bold'
                          }, {
                              text: '100%',
                              style: 'bold'
                          }]
                      ]
                  )
              }
          },

          {
              width: '*',
              text: ''
          },


      ]

  },

  '\n\n',

  {
      text: '2.3 Anomalías térmicas por posición dentro del seguidor',
      style: 'h3'
  },

  '\n',

  {
      text: 'Esta clasificación tiene como fin detectar posibles problemas relacionados con la posición de cada módulo. De este análisis se obtienen problemas relacionados con la vegetación de la instalación, deposiciones de pájaros, etc.',
      style: 'p'
  },
  '\n',

  {
      text: 'Los números de la siguiente tabla indican la cantidad de anomalías térmicas registradas en la posición en la que se encuentran (fila y columna) dentro de cada seguidor. Sólo se incluyen anomalías térmicas de clase 2 y 3.',
      style: 'p'
  },

  '\n',

  {
      columns: [

          {
              width: '*',
              text: ''
          },

          {
              width: 'auto',
              table: {
                  body: this.getTablaPosicion()
              },

          }, {
              width: '*',
              text: ''
          },
      ]
  },

  '\n',

  {
      text: '2.4 MAE de la planta',
      style: 'h3'
  },

  '\n',

  {
      text: 'El MAE (módulo apagados equivalentes) nos da medida cualitativa del impacto que tienen las incidencias registradas en el PR (performance ratio) de la planta.',
      style: 'p'
  },

  '\n',

  {
      text: `MAE = ∆PR / PR = ${this.informe.mae} % (${this.calificacionMae(this.informe.mae)})`,
      style: 'param'
  },

  '\n',

  {
      text: [
          `El MAE de ${this.planta.nombre} el ${this.datePipe.transform(this.informe.fecha*1000, 'dd/MM/yyyy')} es `, {
              text: `${this.informe.mae} %`,
              style: 'bold'
          },
          ` lo que nos indica un MAE `, {
              text: `${this.calificacionMae(this.informe.mae)}.`,
              style: 'bold'
          }
      ],
      style: 'p',
      pageBreak: 'after'
  }



]
};


getDocDefinition() {

  return {
    content: this.getPagesPDF(),
  
    images: {
      imgPortada: this.portadaImgBase64,
      imagenIrradiancia: this.irradianciaImgBase64,
      imgSuciedad: this.imgSuciedadBase64,
      imgCurvaMae: this.imgCurvaMaeBase64,
      imgFormulaMae: this.imgFormulaMaeBase64,
    },
  
    footer: (currentPage, pageCount) => {
        return {
            table: {
                widths: ['*'],
                body: [
                    [{
                        text: currentPage,
                        alignment: 'center'
                    }]
                ]
            },
            layout: 'noBorders'
        };
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
            decoration: 'underline'
        },
        p: {
            alignment: 'justify'
  
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
            color: 'gray'
        },
        subtitulo: {
          alingment: 'right',
          fontSize: 15,
        },
  
        table: {
            alignment: 'center'
        },
  
        param: {
            alignment: 'center',
            bold: true,
            decoration: 'underline'
  
        },
        tableCell: {
            alignment: 'center'
        },
        mae1: {
            fillColor: '#559c55',
            alignment: 'center'
        },
        bold: {
            bold: true
        },
        mae2: {
            fillColor: '#00a0ea',
            alignment: 'center'
        },
        mae3: {
            fillColor: '#fdc400',
            alignment: 'center'
        },
        coa1: {
            color: 'black'
        },
        coa2: {
            color: 'orange'
        },
        coa3: {
            color: 'red'
        }
    }
  };
 }
}