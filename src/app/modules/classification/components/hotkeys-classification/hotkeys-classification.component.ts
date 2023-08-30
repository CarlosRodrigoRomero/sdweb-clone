import { Component, OnInit } from '@angular/core';

import { HotkeysService, Hotkey } from 'angular2-hotkeys';

import { ClassificationService } from '@data/services/classification.service';
import { AnomaliaService } from '@data/services/anomalia.service';

import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-hotkeys-classification',
  templateUrl: './hotkeys-classification.component.html',
  styleUrls: ['./hotkeys-classification.component.css'],
})
export class HotkeysClassificationComponent implements OnInit {
  private anomaliaSelected: Anomalia;
  // private hotkeyTipos = [0, 3, 5, 6, 8, 9, 10, 13, 15, 17, 18];

  constructor(
    private hotkeysService: HotkeysService,
    private classificationService: ClassificationService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.classificationService.anomaliaSelected$.subscribe((anomalia) => (this.anomaliaSelected = anomalia));

    if (this.anomaliaSelected !== undefined) {
      this.hotkeysService.add(
        new Hotkey(
          '1',
          (event: KeyboardEvent): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(8);
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
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(0);
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
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(13);
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
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(9);
            }
            return false; // Prevent bubbling
          },
          undefined,
          '2: varias células caliente (por defecto)'
        )
      );

      this.hotkeysService.add(
        new Hotkey(
          '3',
          (event: KeyboardEvent): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(3);
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
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(10);
            }
            return false; // Prevent bubbling
          },
          undefined,
          'ctrl+3: 2x diodo en circuito abierto'
        )
      );
      this.hotkeysService.add(
        new Hotkey(
          'shift+3',
          (event: KeyboardEvent): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(6);
            }
            return false; // Prevent bubbling
          },
          undefined,
          'shift+3: Diodo en cortocircuito'
        )
      );
      this.hotkeysService.add(
        new Hotkey(
          '4',
          (event: KeyboardEvent): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(17);
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
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(5);
            }
            return false; // Prevent bubbling
          },
          undefined,
          '5: Módulo en circuito abierto'
        )
      );

      this.hotkeysService.add(
        new Hotkey(
          '7',
          (event: KeyboardEvent): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(7);
            }
            return false; // Prevent bubbling
          },
          undefined,
          '7: Módulo en cortocircuito'
        )
      );

      this.hotkeysService.add(
        new Hotkey(
          '8',
          (event: KeyboardEvent): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(18);
            }
            return false; // Prevent bubbling
          },
          undefined,
          '8: Posible PID'
        )
      );

      this.hotkeysService.add(
        new Hotkey(
          'ctrl+8',
          (event: KeyboardEvent): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(20);
            }
            return false; // Prevent bubbling
          },
          undefined,
          'ctrl+8: PID regular'
        )
      );

      this.hotkeysService.add(
        new Hotkey(
          'shift+8',
          (event: KeyboardEvent): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(21);
            }
            return false; // Prevent bubbling
          },
          undefined,
          'shift+8: PID irregular'
        )
      );

      this.hotkeysService.add(
        new Hotkey(
          'd',
          (): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(11);
            }
            return false; // Prevent bubbling
          },
          undefined,
          'D: Suciedad'
        )
      );

      this.hotkeysService.add(
        new Hotkey(
          's',
          (): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              this.updateAnomaliaTipo(15);
            }
            return false; // Prevent bubbling
          },
          undefined,
          'S: Módulo con sombras'
        )
      );

      this.hotkeysService.add(
        new Hotkey(
          'q',
          (event: KeyboardEvent): boolean => {
            if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
              // eliminamos la anomalia de la DB
              this.anomaliaService.deleteAnomalia(this.anomaliaSelected);

              // eliminamos la anomalia de la lista
              this.classificationService.listaAnomalias = this.classificationService.listaAnomalias.filter(
                (anom) => anom.id !== this.anomaliaSelected.id
              );

              // reseteamos lo seleccionado
              this.classificationService.resetElemsSelected();
            }
            return false; // Prevent bubbling
          },
          undefined,
          'q: eliminar anomalia'
        )
      );
    }
  }

  private updateAnomaliaTipo(tipo: number): void {
    this.classificationService.anomaliaSelected.tipo = tipo;

    this.classificationService.listaAnomalias = this.classificationService.listaAnomalias.map((anom) => {
      if (anom.id === this.anomaliaSelected.id) {
        anom.tipo = tipo;
      }
      return anom;
    });

    // actualizamos el tipo en la DB
    this.anomaliaService.updateAnomaliaField(this.classificationService.anomaliaSelected.id, 'tipo', tipo);

    // reseteamos lo seleccionado
    this.classificationService.resetElemsSelected();
  }
}
