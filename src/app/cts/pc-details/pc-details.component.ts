import { Component, OnInit, Input, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { PcInterface } from '../../models/pc';
import 'get-image-pixels';
import Pica from 'pica';
import { InformeInterface } from '../../models/informe';
import { GLOBAL } from 'src/app/services/global';

const pica = Pica();

@Component({
  selector: 'app-pc-details',
  templateUrl: './pc-details.component.html',
  styleUrls: ['./pc-details.component.css']
})
export class PcDetailsComponent implements OnInit, OnChanges {
  @Input() pc: PcInterface;
  @Input() selectedPc: PcInterface;
  @Input() informe: InformeInterface;

  public tooltipTemp: number;
  private maxTemp: number;
  private minTemp: number;
  private canvas: any;
  private tooltipElement: any;
  public pcDescripcion: string[];
  public pcCausa: string[];
  public pcRecomendacion: string[];
  public pcPerdidas: string[];

  constructor() { }

  ngOnInit() {
    this.pc.downloadUrl.subscribe( url => {
      this.pc.downloadUrlString = url;
    });
    this.minTemp = this.informe.tempMin;
    this.maxTemp = this.informe.tempMax;

    this.pcDescripcion = GLOBAL.pcDescripcion;
    this.pcCausa = GLOBAL.pcCausa;
    this.pcRecomendacion = GLOBAL.pcRecomendacion;
    this.pcPerdidas = GLOBAL.pcPerdidas;
  }

  ngOnChanges() {

    if (this.selectedPc === this.pc) {
      this.canvas = document.getElementById(this.pc.id);
      const imagenTermica = new Image();

      imagenTermica.crossOrigin = 'anonymous';
      imagenTermica.src = this.pc.downloadUrlString;
      imagenTermica.onload = () => {
        pica.resize(imagenTermica, this.canvas).then();

        this.canvas.getContext('2d').drawImage(imagenTermica, 0, 0 );
        this.tooltipElement = document.getElementById(`tooltip_${this.pc.id}`);
        // console.log('this.tooltipElement', this.tooltipElement);
      };
  }
}
downloadReclamacion() {
  console.log('reclamacion');
}
 downloadRjpg(pc: PcInterface) {

    this.pc.downloadUrlRjpg$.subscribe( downloadUrl => {
      this.pc.downloadUrlStringRjpg = downloadUrl;
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = (event) => {
        /* Create a new Blob object using the response
        *  data of the onload object.
        */
        const blob = new Blob([xhr.response], { type: 'image/jpg' });
        const a: any = document.createElement('a');
        a.style = 'display: none';
        document.body.appendChild(a);
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = pc.archivoPublico;
        a.click();
        window.URL.revokeObjectURL(url);
      };
      xhr.open('GET', downloadUrl);
      xhr.send();
    });
 }

  onMouseLeaveCanvas($event) {
    this.tooltipElement.style.display = 'none';
  }

  onMouseMoveCanvas($event: MouseEvent) {
    // Temperatura puntual
    const mousePositionData = this.canvas.getContext('2d')
                               .getImageData($event.offsetX, $event.offsetY, 1, 1).data;

    this.tooltipTemp = this.rgb2temp(mousePositionData[0], mousePositionData[1], mousePositionData[2]);

    this.tooltipElement.style.display = 'block';
    this.tooltipElement.style.left = $event.layerX + 'px';
    this.tooltipElement.style.top = $event.layerY + 'px';

  }

  rgb2temp(red: number, green: number, blue: number) {
    // a = (max_temp - min_temp) / 255
    // b= min_temp

    const b = this.minTemp;
    const a = (this.maxTemp - this.minTemp) / 255;

    const x = (red + green + blue) / 3;
    return Math.round((x * a + b) * 10) / 10;
  }

}
