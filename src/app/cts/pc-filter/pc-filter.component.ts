import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { PcInterface } from '../../models/pc';
import { MatButtonToggleGroup, MatButtonToggleChange, MatCheckboxChange } from '@angular/material';
import { PcService } from '../../services/pc.service';
import { GLOBAL } from '../../services/global';

@Component({
  selector: 'app-pc-filter',
  templateUrl: './pc-filter.component.html',
  styleUrls: ['./pc-filter.component.css']
})
export class PcFilterComponent implements OnInit {
  @Input() public allPcs: PcInterface[];
  public severidad: MatButtonToggleGroup;
  public filtroSeveridad: number[];
  public filtroTipo: number[];
  tiposSeveridad = GLOBAL.tipos_severidad;
  labelsSeveridad = GLOBAL.labels_severidad;


  constructor(private pcService: PcService) {
    this.filtroSeveridad = GLOBAL.tipos_severidad;
    this.filtroSeveridad = [1, 2, 3, 4];
    this.filtroTipo = [1, 2, 3, 4, 5, 6];
    // console.log('aaa', this.filtroSeveridad, GLOBAL.tipos_severidad);
  }

  ngOnInit() {
  }


    onCheckBoxSeveridadChange($event: MatCheckboxChange) {

      const checkNumber = parseInt($event.source.value, 10);
      this.filtroSeveridad = this.filtroSeveridad.filter(i => i !== checkNumber);

      if ($event.checked === true) {
        this.filtroSeveridad.push(checkNumber);
      }
      this.pcService.filteredPcs(this.allPcs.filter( (pc) => this.filtroSeveridad.includes(pc.severidad)));

    }

    onCheckBoxTipoChange($event: MatCheckboxChange) {

      const checkNumber = parseInt($event.source.value, 10);
      this.filtroTipo = this.filtroTipo.filter(i => i !== checkNumber);

      if ($event.checked === true) {
        this.filtroTipo.push(checkNumber);
      }
      this.pcService.filteredPcs(this.allPcs.filter( (pc, i, a) => this.filtroTipo.includes(pc.tipo)));
      console.log('filtroTipo', this.filtroTipo);

    }
  }

