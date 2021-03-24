import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Anomalia } from '@core/models/anomalia';
import { PcInterface } from '@core/models/pc';

import { GLOBAL } from '@core/services/global';
import { PlantaService } from '@core/services/planta.service';
import { ShareReportService } from '@core/services/share-report.service';

interface InfoAdicional {
  id?: string;
  fecha?: string;
  hora?: number;
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
  viento?: string;
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

  constructor(
    private plantaService: PlantaService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private shareReportService: ShareReportService
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
    let marcaModulo;
    let modeloModulo;
    let potencia;
    if ((this.anomaliaSelect as PcInterface).modulo !== null) {
      marcaModulo = (this.anomaliaSelect as PcInterface).modulo.marca;
      modeloModulo = (this.anomaliaSelect as PcInterface).modulo.modelo;
      potencia = (this.anomaliaSelect as PcInterface).modulo.potencia;
    }
    this.infoAdicional = {
      id: this.anomaliaSelect.id,
      fecha: (this.anomaliaSelect as PcInterface).datetimeString,
      hora: (this.anomaliaSelect as PcInterface).datetime,
      planta: this.nombrePlanta,
      marcaModulo,
      modeloModulo,
      tipoPanelModulo: 'tipo panel',
      potencia,
      instalacion: this.anomaliaSelect.globalCoords[0],
      calle: this.anomaliaSelect.globalCoords[1],
      mesa: this.anomaliaSelect.globalCoords[2],
      fila: (this.anomaliaSelect as PcInterface).local_y,
      columna: (this.anomaliaSelect as PcInterface).local_x,
      tempMedia: (this.anomaliaSelect as PcInterface).temperaturaMedia,
      tempMax: (this.anomaliaSelect as PcInterface).temperaturaMax, // temperatura defecto en Demo
      gradiente: (this.anomaliaSelect as PcInterface).gradiente,
      irradiancia: (this.anomaliaSelect as PcInterface).irradiancia, // radiación en Demo
      severidad: (this.anomaliaSelect as PcInterface).severidad, // criticidad o relevancia en Demo
      tipoAnomalia: GLOBAL.labels_tipos[this.anomaliaSelect.tipo],
      urlImagenIR: 'url imagen IR',
      urlImagenRGB: 'url imagen RGB',
      nubosidad: (this.anomaliaSelect as PcInterface).nubosidad,
      emisividad: (this.anomaliaSelect as PcInterface).emisividad,
      tempReflejada: (this.anomaliaSelect as PcInterface).temperaturaReflejada,
      viento: (this.anomaliaSelect as PcInterface).viento,
      camaraSN: (this.anomaliaSelect as PcInterface).camaraSN,
      camaraNombre: (this.anomaliaSelect as PcInterface).camaraNombre,
      camaraLente: (this.anomaliaSelect as PcInterface).camaraLente,
    };
  }
}
