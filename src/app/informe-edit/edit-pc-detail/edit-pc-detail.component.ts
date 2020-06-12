import { Component, OnInit, Input } from '@angular/core';
import { InformeService } from '../../services/informe.service';
import { ElementoPlantaInterface } from '../../models/elementoPlanta';
import { Pc } from 'src/app/models/pc';
import { Observable } from 'rxjs';
import { PlantaInterface } from 'src/app/models/planta';
import { take } from 'rxjs/operators';
import { PcService } from '../../services/pc.service';
import { GLOBAL } from 'src/app/services/global';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

@Component({
  selector: 'app-edit-pc-detail',
  templateUrl: './edit-pc-detail.component.html',
  styleUrls: ['./edit-pc-detail.component.css'],
})
export class EditPcDetailComponent implements OnInit {
  selectedPc: Pc;
  planta: PlantaInterface;
  filasArray: number[];
  columnasArray: number[];
  global = GLOBAL;

  @Input() set planta$(obs: Observable<PlantaInterface>) {
    obs.pipe(take(1)).subscribe((planta) => {
      this.planta = planta;
      this.filasArray = [];
      this.columnasArray = [];
      for (let i = 1; i <= this.planta.columnas; i++) {
        this.columnasArray.push(i);
      }
      for (let i = 1; i <= this.planta.filas; i++) {
        this.filasArray.push(i);
      }
    });
  }

  constructor(
    public informeService: InformeService,
    public pcService: PcService,
    private hotkeysService: HotkeysService
  ) {
    this.hotkeysService.add(
      new Hotkey('1', (event: KeyboardEvent): boolean => {
        if (this.checkSelectedPc()) {
          this.selectedPc.tipo = 8;
          this.updatePcInDb(this.selectedPc);
        }
        return false; // Prevent bubbling
      })
    );
    this.hotkeysService.add(
      new Hotkey('2', (event: KeyboardEvent): boolean => {
        if (this.checkSelectedPc()) {
          this.selectedPc.tipo = 9;
          this.updatePcInDb(this.selectedPc);
        }
        return false; // Prevent bubbling
      })
    );
    this.hotkeysService.add(
      new Hotkey('3', (event: KeyboardEvent): boolean => {
        if (this.checkSelectedPc()) {
          this.selectedPc.tipo = 3;
          this.updatePcInDb(this.selectedPc);
        }
        return false; // Prevent bubbling
      })
    );
    this.hotkeysService.add(
      new Hotkey('4', (event: KeyboardEvent): boolean => {
        if (this.checkSelectedPc()) {
          this.selectedPc.tipo = 17;
          this.updatePcInDb(this.selectedPc);
        }
        return false; // Prevent bubbling
      })
    );
    this.hotkeysService.add(
      new Hotkey('5', (event: KeyboardEvent): boolean => {
        if (this.checkSelectedPc()) {
          this.selectedPc.tipo = 5;
          this.updatePcInDb(this.selectedPc);
        }
        return false; // Prevent bubbling
      })
    );
    this.hotkeysService.add(
      new Hotkey('q', (event: KeyboardEvent): boolean => {
        if (this.checkSelectedPc()) {
          this.onClickDeletePc(this.selectedPc);
        }
        return false; // Prevent bubbling
      })
    );
  }
  checkSelectedPc() {
    return (
      this.selectedPc !== undefined && this.selectedPc.archivo === this.informeService.selectedArchivoVuelo.archivo
    );
  }
  ngOnInit(): void {
    this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
      if (elementoPlanta !== null) {
        this.setElementoPlanta(elementoPlanta);
      }
    });
  }

  setElementoPlanta(elementoPlanta: ElementoPlantaInterface) {
    if (elementoPlanta == null) {
      this.selectedPc = null;
    } else {
      if (elementoPlanta.constructor.name === Pc.name) {
        if (this.selectedPc !== elementoPlanta) {
          this.selectedPc = elementoPlanta as Pc;
        }
      }
    }
  }
  onClickDeletePc(pc: Pc) {
    // Avisamos de que estamos eliminando
    this.informeService.avisadorNuevoElementoSource.next(pc);

    // Eliminamos el PC de la bbdd
    this.pcService.delPc(pc);
  }

  onClickLocalCoordsTable(selectedPc: Pc, f: number, c: number) {
    if (this.selectedPc === selectedPc) {
      if (this.planta.tipo !== 'fija') {
        this.selectedPc.local_x = c;
        this.selectedPc.local_y = f;
      } else {
        this.selectedPc.local_y = f;
      }
    }
    this.updatePcInDb(selectedPc);
  }

  // updateLocAreaInPc(pc, globalX, globalY, modulo) {
  //   if (globalX.length > 0) {
  //     pc.global_x = globalX;
  //   }
  //   if (globalY.length > 0) {
  //     pc.global_y = globalY;
  //   }

  //   if (Object.entries(modulo).length > 0 && modulo.constructor === Object) {
  //     pc.modulo = modulo;
  //   }

  //   // pc.datetime = this.current_datetime;

  //   this.updatePcInDb(pc);
  // }

  updatePcInDb(pc: Pc) {
    this.pcService.updatePc(pc).then((res) => {
      // Avisar de que se ha añadido un nuevo elemento
      this.informeService.avisadorChangeElementoSource.next(pc);
    });
  }
}
