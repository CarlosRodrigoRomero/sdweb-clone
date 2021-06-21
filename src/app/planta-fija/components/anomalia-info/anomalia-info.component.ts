import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AngularFireStorage } from '@angular/fire/storage';

import { switchMap, take } from 'rxjs/operators';

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
import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';

import { Anomalia } from '@core/models/anomalia';
import { PcInterface } from '@core/models/pc';
import { InformeInterface } from '@core/models/informe';

interface InfoAdicional {
  id?: string;
  vuelo?: {
    fecha?: string;
    hora?: string;
    irradiancia?: number; // radiación en Demo
    tipoAnomalia?: string;
    emisividad?: number;
    tempReflejada?: number;
    tempAire?: number;
    vientoVelocidad?: number;
    vientoDireccion?: number;
  };
  modulo?: {
    marcaModulo?: string;
    modeloModulo?: string;
    tipoPanelModulo?: string;
    potencia?: number;
  };
  localizacion?: {
    instalacion?: string;
    calle?: string;
    mesa?: string;
    fila?: number;
    columna?: number;
  };
  termico?: {
    gradiente?: number;
    tempMedia?: number;
    tempMax?: number; // temperatura defecto en Demo
  };
  imagen?: {
    urlImagenIR?: string;
    urlImagenRGB?: string;
    camaraSN?: number;
    camaraNombre?: string;
    camaraLente?: string;
  };
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
  public criticidadLabels: string[];
  public infoAdicional: InfoAdicional;
  private plantaId: string;
  private nombrePlanta: string;
  public coloresSeveridad: string[];
  public tiposAnomalias: string[] = GLOBAL.labels_tipos;
  public seccionModulo = false;
  public seccionImagen = false;
  public seccionLocalizacion = false;
  public seccionVuelo = false;
  private informeSelected: InformeInterface = undefined;

  @ViewChild('swiperRef', { static: false }) swiperRef?: SwiperComponent;

  constructor(
    private plantaService: PlantaService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private shareReportService: ShareReportService,
    private anomaliaService: AnomaliaService,
    private storage: AngularFireStorage,
    private reportControlService: ReportControlService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    this.pcDescripcion = GLOBAL.pcDescripcion;
    this.criticidadLabels = GLOBAL.labels_criticidad;
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

    this.reportControlService.selectedInformeId$
      .pipe(switchMap((informeID) => this.informeService.getInforme(informeID)))
      .subscribe((informe) => (this.informeSelected = informe));
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
    /* MODULO */

    let marcaModulo;
    let modeloModulo;
    let potencia;

    if (this.anomaliaSelect.modulo !== undefined && this.anomaliaSelect.modulo !== null) {
      this.seccionModulo = true;
      marcaModulo = this.anomaliaSelect.modulo.marca;
      modeloModulo = this.anomaliaSelect.modulo.modelo;
      potencia = this.anomaliaSelect.modulo.potencia;
    }

    /* LOCALIZACION */

    let instalacion;
    let calle;
    let mesa;
    let fila;
    let columna;

    const coords = this.anomaliaSelect.globalCoords;
    if (coords !== undefined) {
      if (coords[0] !== undefined && coords[0] !== null && coords[0] !== '') {
        instalacion = coords[0];
      }
      if (coords[1] !== undefined && coords[1] !== null && coords[1] !== '') {
        calle = coords[1];
      }
      if (coords[2] !== undefined && coords[2] !== null && coords[2] !== '') {
        mesa = coords[2];
      }
    }

    const localY = this.anomaliaSelect.localY;
    if (localY !== undefined && localY !== null) {
      fila = localY;
    }

    const localX = this.anomaliaSelect.localX;
    if (localX !== undefined && localX !== null) {
      columna = localX;
    }

    if (
      instalacion !== undefined ||
      calle !== undefined ||
      mesa !== undefined ||
      fila !== undefined ||
      columna !== undefined
    ) {
      this.seccionLocalizacion = true;
    }

    /* VUELO */

    let fecha;
    let hora;
    let irradiancia;
    let emisividad;
    let tempReflejada;
    let tempAire;
    let vientoVelocidad;
    let vientoDireccion;

    const datetime = this.anomaliaSelect.datetime;
    if (datetime !== undefined && datetime !== null) {
      fecha = this.unixToDate((this.anomaliaSelect as PcInterface).datetime)[0];
      hora = this.unixToDate((this.anomaliaSelect as PcInterface).datetime)[1];
    }
    const irrad = (this.anomaliaSelect as PcInterface).irradiancia;
    if (irrad !== undefined && irrad !== null) {
      irradiancia = irrad;
    }
    let emis = this.informeSelected.emisividad;
    if (emis === undefined) {
      emis = (this.anomaliaSelect as PcInterface).emisividad;
    }
    if (emis !== undefined && emis !== null) {
      emisividad = emis;
    }
    let tempR = this.informeSelected.tempReflejada;
    if (tempR === undefined) {
      tempR = (this.anomaliaSelect as PcInterface).temperaturaRef;
    }
    if (tempR !== undefined && tempR !== null) {
      tempReflejada = tempR;
    }
    let tempA = this.informeSelected.temperatura;
    if (tempA === undefined) {
      tempA = (this.anomaliaSelect as PcInterface).temperaturaAire;
    }
    if (tempA !== undefined && tempA !== null) {
      tempAire = tempA;
    }
    let vientoV = this.informeSelected.vientoVelocidad;
    if (vientoV === undefined) {
      // este paso solo se aplica a la DEMO
      vientoV = this.anomaliaSelect.vientoVelocidad;
    }
    if (vientoV !== undefined && vientoV !== null) {
      vientoVelocidad = vientoV;
    }
    let vientoD = this.informeSelected.vientoDireccion;
    if (vientoD === undefined) {
      // este paso solo se aplica a la DEMO
      vientoD = this.anomaliaSelect.vientoDireccion;
    }
    if (vientoD !== undefined && vientoD !== null) {
      vientoDireccion = vientoD;
    }

    if (
      fecha !== undefined ||
      hora !== undefined ||
      irradiancia !== undefined ||
      emisividad !== undefined ||
      tempReflejada !== undefined ||
      vientoVelocidad !== undefined ||
      vientoDireccion !== undefined
    ) {
      this.seccionVuelo = true;
    }

    /* IMAGEN */

    let urlImagenIR;
    let urlImagenRGB;
    let camaraSN;
    let camaraNombre;

    /* const urlIR = this.anomaliaSelect.urlImagenIR;
    if (urlIR !== undefined && urlIR !== null) {
      urlImagenIR = urlIR;
    }
    const urlRGB = this.anomaliaSelect.urlImagenRGB;
    if (urlRGB !== undefined && urlRGB !== null) {
      urlImagenRGB = urlRGB;
    } */
    const camSN = this.anomaliaSelect.camaraSN;
    if (camSN !== undefined && camSN !== null) {
      camaraSN = camSN;
    }
    const camNombre = this.anomaliaSelect.camaraModelo;
    if (camNombre !== undefined && camNombre !== null) {
      camaraNombre = camNombre;
    }

    if (
      urlImagenIR !== undefined ||
      urlImagenRGB !== undefined ||
      camaraSN !== undefined ||
      camaraNombre !== undefined
    ) {
      this.seccionImagen = true;
    }

    this.infoAdicional = {
      // GENERAL
      id: this.anomaliaSelect.localId,
      vuelo: {
        fecha,
        hora,
        irradiancia, // radiación en Demo
        emisividad,
        tempReflejada,
        tempAire,
        vientoVelocidad,
        vientoDireccion,
      },
      modulo: {
        marcaModulo,
        modeloModulo,
        // tipoPanelModulo: 'tipo panel',
        potencia,
      },
      localizacion: {
        instalacion,
        calle,
        mesa,
        fila,
        columna,
      },

      // TERMICO
      termico: {
        tempMedia: (this.anomaliaSelect as PcInterface).temperaturaMedia,
        gradiente: this.anomaliaSelect.gradiente,
      },

      imagen: {
        // urlImagenIR: 'url imagen IR',
        // urlImagenRGB: 'url imagen RGB',
        camaraSN,
        camaraNombre,
      },
    };
  }

  unixToDate(unix: number): string[] {
    const date = new Date(unix * 1000);

    return date.toLocaleString().split(' ');
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

  deleteAnomalia() {
    this.anomaliaService.deleteAnomalia(this.anomaliaSelect);
    this.anomaliaSelect = undefined;
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
