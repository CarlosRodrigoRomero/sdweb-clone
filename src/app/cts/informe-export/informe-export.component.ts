import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GLOBAL } from '../../services/global';

import { PlantaService } from '../../services/planta.service';
import { InformeService } from '../../services/informe.service';
import { PcService } from '../../services/pc.service';

import { PcInterface } from '../../models/pc';
import { PlantaInterface } from '../../models/planta';
import { InformeInterface } from '../../models/informe';
import 'fabric';

import html2pdf from 'html2pdf.js';
import { AngularFireStorage } from '@angular/fire/storage';
import { Observable } from 'rxjs';

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

  constructor(
    private storage: AngularFireStorage
  ) {

    this.numCategorias = Array(GLOBAL.labels_tipos.length).fill(0).map( (_, i) => i + 1 );
    this.numClases = Array(GLOBAL.labels_severidad.length).fill(0).map( (_, i) => i + 1 );

    this.countCategoria = Array();
    this.countClase = Array();
    this.countPosicion = Array();
    this.global = GLOBAL;

    this.url = GLOBAL.url;
    this.titulo = 'Vista de informe';
    this.tipoInforme = 1;
  }

  ngOnInit() {
    // Ordenar Pcs por seguidor:
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


  public downloadPDF0() {
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
  // downloadPDF() {
  //   const doc = new jsPDF();
  //   window.html2canvas = html2canvas;

  //   const content = document.getElementById('pdfContent');
  //   // console.log('content', content.innerHTML);

  //   doc.html(content.innerHTML, {
  //     callback: (d) => {
  //       d.save('test.pdf');
  //     }
  //   });
  // }


  // public downloadPDF2() {
  //   const data = document.getElementById('pdfContent');
  //   html2canvas(data).then(canvas => {
  //     // Few necessary setting options
  //     const imgWidth = 208;
  //     const pageHeight = 295;
  //     const imgHeight = canvas.height * imgWidth / canvas.width;
  //     const heightLeft = imgHeight;

  //     const contentDataURL = canvas.toDataURL('image/png');
  //     const pdf = new jsPDF('p', 'mm', 'a4'); // A4 size page of PDF
  //     const position = 0;
  //     pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
  //     pdf.save('MYPdf.pdf'); // Generated PDF
  //     });
  // }
  // public downloadPDF3() {
  //   html2canvas(document.querySelector('#chart2'), {scale: 1}).then(canvas => {
  //     const doc = new jsPDF();
  //     doc.setFontSize(40);
  //     doc.text(35, 25, 'Paranyan loves jsPDF');

  //     console.log('canvas', canvas);
  //     doc.addImage(canvas.toDataURL('image/png'), 'PNG', 15, 40, 180, 160);
  //     doc.save('pdf3.pdf');
  //   });
  // }

//   CSVToArray( strData: string, strDelimiter ) {
//     // Check to see if the delimiter is defined. If not,
//     // then default to comma.
//     strDelimiter = (strDelimiter || ',');

//     // Create a regular expression to parse the CSV values.
//     const objPattern = new RegExp(
//         (
//             // Delimiters.
//             '(\\' + strDelimiter + '|\\r?\\n|\\r|^)' +

//             // Quoted fields.
//             '(?:"([^"]*(?:""[^"]*)*)"|' +

//             // Standard fields.
//             '([^"\\' + strDelimiter + '\\r\\n]*))'
//         ),
//         'gi'
//         );


//     // Create an array to hold our data. Give the array
//     // a default empty first row.
//     const arrData = [[]];

//     // Create an array to hold our individual pattern
//     // matching groups.
//     let arrMatches = null;


//     // Keep looping over the regular expression matches
//     // until we can no longer find a match.
//     while (arrMatches = objPattern.exec( strData )) {

//         // Get the delimiter that was found.
//         const strMatchedDelimiter = arrMatches[ 1 ];

//         // Check to see if the given delimiter has a length
//         // (is not the start of string) and if it matches
//         // field delimiter. If id does not, then we know
//         // that this delimiter is a row delimiter.
//         if (
//             strMatchedDelimiter.length &&
//             strMatchedDelimiter !== strDelimiter
//             ) {

//             // Since we have reached a new row of data,
//             // add an empty row to our data array.
//             arrData.push( [] );

//         }

//         let strMatchedValue;

//         // Now that we have our delimiter out of the way,
//         // let's check to see which kind of value we
//         // captured (quoted or unquoted).
//         if (arrMatches[ 2 ]) {

//             // We found a quoted value. When we capture
//             // this value, unescape any double quotes.
//             strMatchedValue = arrMatches[ 2 ].replace(
//                 new RegExp( '""', 'g' ),
//                 '"'
//                 );

//         } else {

//             // We found a non-quoted value.
//             strMatchedValue = arrMatches[ 3 ];

//         }


//         // Now that we have our value string, let's add
//         // it to the data array.
//         arrData[ arrData.length - 1 ].push( strMatchedValue );
//     }

//     // Return the parsed data.
//     return( arrData );
// }


}


