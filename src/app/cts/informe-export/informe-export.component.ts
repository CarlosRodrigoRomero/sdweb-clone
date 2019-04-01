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

import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  public pcs: PcInterface[];
  public url: string;
  public dataTipos: any;
  public dataSeveridad: any;
  public numTipos;
  public numSeveridad;
  public countTipos;
  public countPosicion;
  public countSeveridad;
  public mae;
  public fechaVuelo: string;
  public global = GLOBAL;

  constructor(
    // private _route: ActivatedRoute,
    // private _router: Router,
    // private _informeService: InformeService,
    // private _plantaService: PlantaService,
    // private _pcService: PcService
  ) {

    // GLOBAL.numTipos
    this.numTipos = Array(GLOBAL.labels_tipos.length).fill(0).map( (_, i) => i + 1 );
    this.numSeveridad = Array(GLOBAL.labels_severidad.length).fill(0).map( (_, i) => i + 1 );

    this.countTipos = Array();
    this.countSeveridad = Array();
    this.countPosicion = Array();

    this.url = GLOBAL.url;
    this.titulo = 'Vista de informe';
  }

  ngOnInit() {
    const arrayFilas = Array(this.planta.filas).fill(0).map( (_, i) => i + 1);
    const arrayColumnas = Array(this.planta.columnas).fill(0).map( (_, i) => i + 1);

    this.fechaVuelo = new Date(this.informe.fecha).toLocaleDateString();

    //

    // Calcular las perdidas y severidad(1 leve, 2 media, 3 grave, 4 muy grave)
    let perdidas = 0;
    let contadorPcs = 0;
    for (let pc of this.allPcs) {
      if (pc.tipo === 3 || pc.tipo === 4 || pc.tipo === 5 || pc.tipo === 6 )  {
        // Severidad: 3 grave
        pc.severidad = 3;
      } else if (pc.tipo === 1 || pc.tipo === 2 || pc.tipo === 8 || pc.tipo === 9) {
        if ( pc.temperaturaMax > this.planta.temp_limite ) {
          pc.severidad = 4; // muy grave

        } else {
          let dt = pc.temperaturaMax - this.informe.tempMediaModulos;
          if (dt >= GLOBAL.severidad_dt[2]) {
            pc.severidad = 3; // grave
 
          } else if (dt >= GLOBAL.severidad_dt[1]) {
            pc.severidad = 2; // Media
          } else {
            pc.severidad = 1; // Leve
          }
        }
      } else {
        pc.severidad = 2; // Media
      }
      perdidas = perdidas + GLOBAL.perdidas_tipo[pc.tipo - 1];

      this.allPcs[contadorPcs] = pc;
      contadorPcs += 1;
    }


    // Calcular las alturas
    for (let y of arrayFilas) {
      const countColumnas = Array();
      for (let x of arrayColumnas) {
        countColumnas.push(this.allPcs.filter( pc => pc.local_x === x && pc.local_y === y).length);
      }
      this.countPosicion.push(countColumnas);
    }

    // Calcular los tipos de puntos calientes
    let filtroTipos;
    for (let i of this.numTipos) {
      filtroTipos = this.allPcs.filter( pc => pc.tipo === i);
      this.countTipos.push(filtroTipos.length);
    }

    // Calcular la severidad
    let filtroSeveridad;
    // console.log('numSeveridad', this.numSeveridad);
    // console.log('allPcs', this.allPcs);

    for (let j of this.numSeveridad) {
      filtroSeveridad = this.allPcs.filter( pc => pc.severidad === j);
      // console.log('filtroSeveridad', filtroSeveridad);
      this.countSeveridad.push(filtroSeveridad.length);
    }


    this.dataTipos = {
      labels: GLOBAL.labels_tipos,
      datasets: [
          {
              label: 'Tipos',
              backgroundColor: '#42A5F5',
              borderColor: '#1E88E5',
              data: this.countTipos
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
                data: this.countSeveridad
            },
          ]
        };

  }



  // downloadPDF() {
  //   const doc = new jsPDF();

  //   const specialElementHandlers = {
  //     '#editor': function(element, renderer) {
  //       return true;
  //     }
  //   };

  //   const content = this.content.nativeElement;

  //   doc.fromHTML(content.innerHTML, 15, 15, {
  //     'width': 190,
  //     'elementHandlers': specialElementHandlers
  //   });

  //   doc.save('test.pdf');
  // }


  public downloadPDF2() {
    const data = document.getElementById('content');
    html2canvas(data).then(canvas => {
      // Few necessary setting options
      const imgWidth = 208;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const heightLeft = imgHeight;

      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // A4 size page of PDF
      const position = 0;
      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      pdf.save('MYPdf.pdf'); // Generated PDF
      });
  }

}


