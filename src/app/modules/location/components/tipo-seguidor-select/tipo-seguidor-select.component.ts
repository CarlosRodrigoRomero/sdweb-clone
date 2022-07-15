import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { take } from 'rxjs/operators';

import { TipoSeguidorService } from '@data/services/tipo-seguidor.service';

import { LocationAreaInterface } from '@core/models/location';
import { TipoSeguidor } from '@core/models/tipoSeguidor';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-tipo-seguidor-select',
  templateUrl: './tipo-seguidor-select.component.html',
  styleUrls: ['./tipo-seguidor-select.component.css'],
})
export class TipoSeguidorSelectComponent implements OnInit {
  @Input() selectedLocationArea: LocationAreaInterface;
  @Output() locAreaUpdated = new EventEmitter<LocationAreaInterface>();

  tiposSeguidor: TipoSeguidor[] = [];
  tipoFila = true;

  constructor(private tipoSeguidorService: TipoSeguidorService) {}

  ngOnInit(): void {
    this.tipoSeguidorService
      .getTiposSeguidor()
      .pipe(take(1))
      .subscribe((tipos) => (this.tiposSeguidor = tipos));
  }

  updateTipoSeguidor(event: MatSelectChange) {
    this.selectedLocationArea.tipoSeguidor = event.value;
    this.locAreaUpdated.emit(this.selectedLocationArea);
  }

  clearTipoSeguidor(locArea: LocationAreaInterface) {
    delete locArea.tipoSeguidor;

    this.locAreaUpdated.emit(locArea);
  }

  stopPropagation(event) {
    event.stopPropagation();
  }
}
