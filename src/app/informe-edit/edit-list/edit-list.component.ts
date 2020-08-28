import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { InformeService } from '../../services/informe.service';
import { MatTableDataSource } from '@angular/material/table';
import { ArchivoVueloInterface } from '../../models/archivoVuelo';
import { ActivatedRoute } from '@angular/router';
import { ElementoPlantaInterface } from '../../models/elementoPlanta';
import { MatSort } from '@angular/material/sort';
import { map, switchMap, take } from 'rxjs/operators';
import { PcService } from '../../services/pc.service';
import { combineLatest } from 'rxjs';
import { Pc } from 'src/app/models/pc';
import { EstructuraConPcs, Estructura } from 'src/app/models/estructura';
import { PlantaService } from 'src/app/services/planta.service';
import { PlantaInterface } from '../../models/planta';
import { MatPaginator } from '@angular/material/paginator';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

@Component({
  selector: 'app-edit-list',
  templateUrl: './edit-list.component.html',
  styleUrls: ['./edit-list.component.css'],
})
export class EditListComponent implements OnInit {
  @Input() pcsOrEstructuras: boolean;

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumnsEst: string[];
  displayedColumnsPc: string[];
  dataSourceEst = new MatTableDataSource<EstructuraConPcs>();
  dataSourcePcs = new MatTableDataSource<Pc>();
  informeId: string;
  planta: PlantaInterface;
  estConPcs: EstructuraConPcs[];
  selectedEstructura: ElementoPlantaInterface;

  constructor(
    private route: ActivatedRoute,
    public informeService: InformeService,
    public pcService: PcService,
    private plantaService: PlantaService,
    private hotkeysService: HotkeysService
  ) {
    this.hotkeysService.add(
      new Hotkey(
        'e',
        (event: KeyboardEvent): boolean => {
          this.nextEstructura();
          return false; // Prevent bubbling
        },
        undefined,
        'siguiente estructura'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        'w',
        (event: KeyboardEvent): boolean => {
          this.previousEstructura();
          return false; // Prevent bubbling
        },
        undefined,
        'anterior estructura'
      )
    );
  }

  ngOnInit() {
    this.informeId = this.route.snapshot.paramMap.get('id');
    this.displayedColumnsPc = ['error', 'localId', 'tipo', 'globalCoords', 'localCoords', 'modulo'];

    this.displayedColumnsEst = ['error', 'vuelo', 'globalCoords'];
    // this.dataSourceEst.paginator = this.paginator;
    this.dataSourceEst.sort = this.sort;
    this.dataSourceEst.paginator = this.paginator;
    this.dataSourceEst.filterPredicate = (data: EstructuraConPcs, filter: string) => {
      // return this.pcsOrEstructuras2 ? data.constructor.name === Pc.name : data.constructor.name === Estructura.name;
      return true;
    };

    const allEstructuras$ = this.informeService.getAllEstructuras(this.informeId).pipe(
      map((estArray) => {
        return estArray.sort(this.dynamicSort('archivo'));
      })
    );
    const allPcs$ = this.pcService.getPcsInformeEdit(this.informeId);

    combineLatest([allEstructuras$, allPcs$])
      .pipe(take(1))
      .subscribe((elem) => {
        this.estConPcs = elem[0].map((est) => {
          const pcs = elem[1].filter((pc) => {
            return pc.archivo === est.archivo;
          });
          return { estructura: est, pcs };
        });

        this.dataSourceEst.data = this.estConPcs;
      });

    this.informeService.avisadorChangeElemento$.subscribe((elem) => {
      if (elem.constructor.name === Estructura.name) {
        const estructura = elem as Estructura;
        this.estConPcs = this.estConPcs.map((estConPcs) => {
          if (estConPcs.estructura.id === estructura.id) {
            return { estructura, pcs: estConPcs.pcs };
          } else {
            return estConPcs;
          }
        });

        this.updatePcsDeEstructura(estructura);
      } else if (elem.constructor.name === Pc.name) {
        const pc = elem as Pc;
        this.estConPcs = this.estConPcs.map((estConPcs) => {
          if (estConPcs.estructura.archivo === elem.archivo) {
            const elemPos = estConPcs.pcs.findIndex((val) => {
              return val.id === pc.id;
            });
            if (elemPos >= 0) {
              estConPcs.pcs.splice(elemPos, 1);
              estConPcs.pcs.push(pc);
              return estConPcs;
            }
          }
          return estConPcs;
        });
      }
      this.dataSourceEst.data = this.estConPcs;
    });

    this.informeService.avisadorNuevoElemento$.subscribe((elem) => {
      if (elem.constructor.name === Estructura.name) {
        const estructura = elem as Estructura;

        // Comprobar si ya existía
        const estPos = this.estConPcs.findIndex((val) => {
          return val.estructura.id === elem.id;
        });

        // Si existe, entonces le estamos borrando:
        if (estPos >= 0) {
          // Cuando borramos la estructura, borramos tambien todos sus pcs
          this.borrarPcsEstructura(estructura);

          this.estConPcs.splice(estPos, 1);
        } else {
          // Si no existe, le añadimos al array sin ningun pc
          this.estConPcs.push({ estructura, pcs: [] });
          this.estConPcs.sort((a, b) =>
            a.estructura.archivo > b.estructura.archivo ? 1 : b.estructura.archivo > a.estructura.archivo ? -1 : 0
          );
          this.selectedEstructura = estructura;
        }
      } else if (elem.constructor.name === Pc.name) {
        const pc = elem as Pc;
        const arrayPosition = this.estConPcs.findIndex((val) => {
          return val.estructura.archivo === elem.archivo;
        });
        if (arrayPosition >= 0) {
          const pcPosition = this.estConPcs[arrayPosition].pcs.findIndex((val) => {
            return val.id === pc.id;
          });

          if (pcPosition >= 0) {
            // Si existe, entonces le eliminamos

            // Si existe, entonces le estamos borrando
            this.estConPcs[arrayPosition].pcs.splice(pcPosition, 1);
          } else {
            // Si no existe, entonces le añadimos
            this.estConPcs[arrayPosition].pcs.push(pc);
          }
        }
      }

      this.dataSourceEst.data = this.estConPcs;
    });

    this.informeService.selectedArchivoVuelo$.subscribe((archivoVuelo) => {
      this.setArchivoVuelo(archivoVuelo);
    });

    this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
      if (elementoPlanta !== null) {
        this.setElementoPlanta(elementoPlanta);
      }
    });

    this.informeService
      .getInforme(this.informeId)
      .pipe(
        switchMap((informe) => {
          return this.plantaService.getPlanta(informe.plantaId);
        })
      )
      .subscribe((planta) => {
        this.planta = planta;
      });
  }

  private updatePcsDeEstructura(estructura: Estructura) {
    // Update modulo, latitud, longitud y globalCoords
    this.estConPcs
      .filter((elem) => {
        return elem.estructura.id === estructura.id;
      })
      .forEach((item) => {
        item.pcs.forEach((pc) => {
          pc.setLatLng({ lat: estructura.latitud, lng: estructura.longitud });
          pc.setGlobals(estructura.globalCoords);
          pc.setModulo(estructura.modulo);

          this.pcService.updatePc(pc);
        });
      });
  }

  private borrarPcsEstructura(estructura: Estructura) {
    this.estConPcs
      .filter((val) => {
        return val.estructura.id === estructura.id;
      })
      .forEach((elem) => {
        elem.pcs.forEach((pc) => {
          this.pcService.delPc(pc).then((v) => {});
        });
      });
  }
  private nextEstructura() {
    const isSameEstructura = (estructuraConPcs: EstructuraConPcs) =>
      estructuraConPcs.estructura.archivo === this.selectedEstructura.archivo;

    const estructurasMismoArchivo = this.estConPcs.filter((est) => {
      return this.selectedEstructura.archivo === est.estructura.archivo;
    }).length;

    const nextEstructuraIndex = this.estConPcs.findIndex(isSameEstructura) + estructurasMismoArchivo;
    const nextEstructura = this.estConPcs[nextEstructuraIndex].estructura;
    this.onClickRowList(nextEstructura);
  }
  private previousEstructura() {
    const isSameEstructura = (estructuraConPcs: EstructuraConPcs) =>
      estructuraConPcs.estructura.archivo === this.selectedEstructura.archivo;
    const prevEstructuraIndex = -1 + this.estConPcs.findIndex(isSameEstructura);
    const prevEstructura = this.estConPcs[prevEstructuraIndex].estructura;
    this.onClickRowList(prevEstructura);
  }

  recalcularLocs() {
    this.estConPcs.forEach(async (estConPcs: EstructuraConPcs) => {
      const estructura = estConPcs.estructura;

      if (this.planta.autoLocReady) {
        let globalCoords;
        let modulo;
        [globalCoords, modulo] = this.plantaService.getGlobalCoordsFromLocationArea(estructura.getLatLng());
        estructura.setModulo(modulo);
        estructura.setGlobals(globalCoords);

        await this.informeService.updateEstructura(this.informeId, estructura);
      } else {
        let globalCoords;
        let modulo;
        [globalCoords, modulo] = this.plantaService.getGlobalCoordsFromLocationArea(estructura.getLatLng());
        if (modulo !== null) {
          estructura.setModulo(modulo);
        }
      }

      estConPcs.pcs.forEach(async (pc) => {
        pc.setLatLng(estructura.getLatLng());
        pc.setGlobals(estructura.globalCoords);
        if (estructura.modulo !== null) {
          pc.setModulo(estructura.modulo);
        }

        await this.pcService.updatePc(pc);
        console.log('pc updated');
      });
    });
  }

  setArchivoVuelo(archivoVuelo: ArchivoVueloInterface): void {
    this.applyFilter(archivoVuelo.vuelo);
  }

  setElementoPlanta(elementoPlanta: ElementoPlantaInterface): void {
    this.setArchivoVuelo({ archivo: elementoPlanta.archivo, vuelo: elementoPlanta.vuelo } as ArchivoVueloInterface);

    if (elementoPlanta.constructor.name === Estructura.name) {
      this.selectedEstructura = elementoPlanta;
    }
  }

  onClickRowList(elementoPlanta: ElementoPlantaInterface): void {
    // Comunicar al componente principal que el elemento seleccionado cambia
    this.setElementoPlanta(elementoPlanta);
    this.informeService.selectElementoPlanta(elementoPlanta);

    if (elementoPlanta.constructor.name === Estructura.name) {
      this.dataSourcePcs.data = this.dataSourceEst.data
        .filter((item) => {
          return item.estructura.id === elementoPlanta.id;
        })
        .map((item) => {
          return item.pcs;
        })[0];
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.dataSourceEst.filter = filterValue;
  }

  private dynamicSort(property) {
    let sortOrder = -1;

    if (property[0] === '-') {
      sortOrder = -1;
      property = property.substr(1);
    }

    return (a, b) => {
      if (sortOrder === -1) {
        return b[property].localeCompare(a[property]);
      } else {
        return a[property].localeCompare(b[property]);
      }
    };
  }
}
