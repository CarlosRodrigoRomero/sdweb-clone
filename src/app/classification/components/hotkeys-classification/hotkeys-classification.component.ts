import { Component, OnInit } from '@angular/core';

import { HotkeysService, Hotkey } from 'angular2-hotkeys';

import { ClassificationService } from '@core/services/classification.service';
import { AnomaliaService } from '@core/services/anomalia.service';

@Component({
  selector: 'app-hotkeys-classification',
  templateUrl: './hotkeys-classification.component.html',
  styleUrls: ['./hotkeys-classification.component.css'],
})
export class HotkeysClassificationComponent implements OnInit {
  constructor(
    private hotkeysService: HotkeysService,
    private classificationService: ClassificationService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.classificationService.anomaliaSelected$.subscribe((anomaliaSelected) => {
      this.hotkeysService.add(
        new Hotkey(
          '1',
          (event: KeyboardEvent): boolean => {
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 8;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 0;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 13;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 9;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 15;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 3;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 10;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 6;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 17;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 5;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              this.classificationService.anomaliaSelected.tipo = 18;
              // actualizamos el tipo en la DB
              this.anomaliaService.updateAnomalia(this.classificationService.anomaliaSelected);

              // ocultamos el popup
              this.classificationService.hidePopup();
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
            if (anomaliaSelected !== undefined && anomaliaSelected !== null) {
              // eliminamos la anomalia de la DB
              this.anomaliaService.deleteAnomalia(anomaliaSelected);

              this.classificationService.anomaliaSelected = undefined;

              // ocultamos el popup
              this.classificationService.hidePopup();
            }
            return false; // Prevent bubbling
          },
          undefined,
          'q: eliminar anomalia'
        )
      );
    });
  }
}
