import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { SwiperComponent } from 'swiper/angular';

// import Swiper core and required components
import SwiperCore, {
  Navigation,
  Pagination,
  Scrollbar,
  A11y,
  Virtual,
  Zoom,
  Autoplay,
  Thumbs,
  Controller,
} from 'swiper/core';

// install Swiper components
SwiperCore.use([Navigation, Pagination, Scrollbar, A11y, Virtual, Zoom, Autoplay, Thumbs, Controller]);

import { GLOBAL } from '@core/services/global';
import { PlantaService } from '@core/services/planta.service';
import { ShareReportService } from '@core/services/share-report.service';
import { AnomaliaService } from '@core/services/anomalia.service';

import { Anomalia } from '@core/models/anomalia';
import { PcInterface } from '@core/models/pc';
import { take } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';

interface InfoAdicional {
  id?: string;
  fecha?: string;
  hora?: string;
  planta?: string; // nombre planta
  marcaModulo?: string;
  modeloModulo?: string;
  tipoPanelModulo?: string;
  potencia?: number;
  instalacion?: string;
  calle?: string;
  mesa?: string;
  fila?: number;
  columna?: number;
  tempMedia?: number;
  tempMax?: number; // temperatura defecto en Demo
  gradiente?: number;
  irradiancia?: number; // radiación en Demo
  severidad?: number; // criticidad o relevancia en Demo
  tipoAnomalia?: string;
  urlImagenIR?: string;
  urlImagenRGB?: string;
  nubosidad?: string;
  emisividad?: number;
  tempReflejada?: number;
  vientoVelocidad?: number;
  vientoDireccion?: number;
  camaraSN?: number;
  camaraNombre?: string;
  camaraLente?: string;
}
@Component({
  selector: 'app-anomalia-info',
  templateUrl: './anomalia-info.component.html',
  styleUrls: ['./anomalia-info.component.css'],
})
export class AnomaliaInfoComponent implements OnInit, OnChanges {
  @Input() anomaliaSelect: Anomalia;
  @Input() anomaliaHover: Anomalia;
  public displayedColumns: string[] = ['clase', 'tipo', 'tempMax', 'gradienteNormalizado', 'perdidas'];
  public dataSource: Anomalia[];
  public dataType: any;
  public pcDescripcion: string[];
  public infoAdicional: InfoAdicional;
  private plantaId: string;
  private nombrePlanta: string;
  public coloresSeveridad: string[];
  public tiposAnomalias: string[] = GLOBAL.labels_tipos;

  @ViewChild('swiperRef', { static: false }) swiperRef?: SwiperComponent;

  constructor(
    private plantaService: PlantaService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private shareReportService: ShareReportService,
    private anomaliaService: AnomaliaService,
    private storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    this.pcDescripcion = GLOBAL.pcDescripcion;
    this.dataSource = [this.anomaliaHover];
    this.dataType = {
      clase: 'number',
      tipo: 'number',
      gradienteNormalizado: 'number',
      perdidas: 'number',
    };
    this.coloresSeveridad = GLOBAL.colores_severidad;

    if (this.router.url.includes('shared')) {
      this.shareReportService.getParams().subscribe((params) => (this.plantaId = params.plantaId));
    } else {
      this.plantaId = this.activatedRoute.snapshot.paramMap.get('id');
    }

    this.plantaService.getPlanta(this.plantaId).subscribe((planta) => (this.nombrePlanta = planta.nombre));
  }

  ngOnChanges() {
    // si hay una anomalia seleccionada deja de aparecer el popup en el hover
    if (this.anomaliaSelect === undefined) {
      this.infoAdicional = undefined;
      if (this.anomaliaHover !== undefined) {
        this.dataSource = [this.anomaliaHover];
      } else {
        this.dataSource = null;
      }
    } else {
      this.dataSource = [this.anomaliaSelect];

      // obtenemos la info adicional
      this.getInfoAdcional();
    }
  }

  getInfoAdcional() {
    /* PARA LA DEMO */

    this.infoAdicional = {
      id: this.anomaliaSelect.localId,
      fecha: this.unixToDate((this.anomaliaSelect as PcInterface).datetime),
      hora: this.unixToTime((this.anomaliaSelect as PcInterface).datetime),
      planta: this.nombrePlanta,
      marcaModulo: this.anomaliaSelect.modulo.marca,
      modeloModulo: this.anomaliaSelect.modulo.modelo,
      // tipoPanelModulo: 'tipo panel',
      potencia: this.anomaliaSelect.modulo.potencia,
      instalacion: this.anomaliaSelect.globalCoords[0],
      calle: this.anomaliaSelect.globalCoords[1],
      mesa: this.anomaliaSelect.globalCoords[2],
      fila: this.anomaliaSelect.localY,
      columna: this.anomaliaSelect.localX,
      // tempMedia: (this.anomaliaSelect as PcInterface).temperaturaMedia,
      // tempMax: (this.anomaliaSelect as PcInterface).temperaturaMax, // temperatura defecto en Demo
      // gradiente: (this.anomaliaSelect as PcInterface).gradiente,
      irradiancia: (this.anomaliaSelect as PcInterface).irradiancia, // radiación en Demo
      severidad: this.anomaliaSelect.severidad, // criticidad o relevancia en Demo
      tipoAnomalia: GLOBAL.labels_tipos[this.anomaliaSelect.tipo],
      // urlImagenIR: 'url imagen IR',
      // urlImagenRGB: 'url imagen RGB',
      nubosidad: (this.anomaliaSelect as PcInterface).nubosidad,
      emisividad: (this.anomaliaSelect as PcInterface).emisividad,
      tempReflejada: (this.anomaliaSelect as PcInterface).temperaturaReflejada,
      vientoVelocidad: this.anomaliaSelect.vientoVelocidad,
      vientoDireccion: this.anomaliaSelect.vientoDireccion,
      camaraSN: this.anomaliaSelect.camaraSN,
      camaraNombre: this.anomaliaSelect.camaraModelo,
    };
  }

  unixToDate(unix: number): string {
    const date = new Date(unix * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDay();
    return day + '/' + month + '/' + year;
  }

  unixToTime(unix: number): string {
    const date = new Date(unix * 1000);
    const hour = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return hour + ':' + minutes + ':' + seconds;
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  onEdit(event, field: string) {
    if (event.value !== undefined) {
      this.anomaliaSelect[field] = event.value;
    } else {
      this.anomaliaSelect[field] = event.target.value;
    }
    this.anomaliaService.updateAnomalia(this.anomaliaSelect);
  }

  deleteAnomalia(anomalia: Anomalia) {
    console.log('anom', anomalia);
  }
  downloadRjpg(selectedAnomalia: Anomalia) {
    const archivoPublico = selectedAnomalia.archivoPublico.concat('.jpg');
    this.storage
      .ref(`informes/${selectedAnomalia.informeId}/rjpg/${archivoPublico}`)
      .getDownloadURL()
      .pipe(take(1))
      .subscribe((downloadUrl) => {
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
          a.download = `radiometrico_${archivoPublico}`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        xhr.open('GET', downloadUrl);
        xhr.send();
      });
  }
}
