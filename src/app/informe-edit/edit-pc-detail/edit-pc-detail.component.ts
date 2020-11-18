import { Component, OnInit, Input } from '@angular/core';
import { InformeService } from '@core/services/informe.service';
import { ElementoPlantaInterface } from '@core/models/elementoPlanta';
import { Pc } from '@core/models/pc';
import { Observable } from 'rxjs';
import { PlantaInterface } from '@core/models/planta';
import { take } from 'rxjs/operators';
import { PcService } from '@core/services/pc.service';
import { GLOBAL } from '@core/services/global';
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
      new Hotkey(
        '1',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 8;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        '1: una célula caliente'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        'shift+1',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 0;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        'shift+1: Sin anomalias'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        'ctrl+1',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 13;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        'ctrl+1: cross-connection'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        '2',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 9;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        '2: varias células caliente (por defecto)'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        'shift+2',
        (): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 15;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        'shift+2: Módulo con sombras'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        '3',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 3;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        '3: varias células caliente (por defecto)'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        'ctrl+3',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 10;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        'ctrl+3: 2x substring en circuito abierto'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        'shift+3',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 6;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        'shift+3: Substring en cortocircuito'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        '4',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 17;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        '4: String en circuito abierto'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        '5',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 5;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        '5: Módulo en circuito abierto'
      )
    );

    this.hotkeysService.add(
      new Hotkey(
        '8',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.selectedPc.tipo = 18;
            this.updatePcInDb(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        '8: Posible PID'
      )
    );

    this.hotkeysService.add(
      new Hotkey(
        'q',
        (event: KeyboardEvent): boolean => {
          if (this.checkSelectedPc()) {
            this.onClickDeletePc(this.selectedPc);
          }
          return false; // Prevent bubbling
        },
        undefined,
        'q: eliminar anomalia'
      )
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
    this.informeService.selectedPc$.subscribe((pc) => {
      if (pc === null) {
        this.selectedPc = undefined;
      }
    });
  }

  setElementoPlanta(elementoPlanta: ElementoPlantaInterface) {
    if (elementoPlanta == null) {
      this.selectedPc = undefined;
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
