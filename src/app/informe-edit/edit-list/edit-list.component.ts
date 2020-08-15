import { Component, OnInit, Input, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { InformeService } from '../../services/informe.service';
import { MatTableDataSource } from '@angular/material/table';
import { ArchivoVueloInterface } from '../../models/archivoVuelo';
import { ActivatedRoute } from '@angular/router';
import { ElementoPlantaInterface } from '../../models/elementoPlanta';
import { MatSort } from '@angular/material/sort';
import { map, switchMap } from 'rxjs/operators';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditListComponent implements OnInit {
  @Input() set pcsOrEstructuras(value: boolean) {
    this.pcsOrEstructuras2 = value;
  }

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumnsEst: string[];
  displayedColumnsPc: string[];
  dataSourceEst = new MatTableDataSource<EstructuraConPcs>();
  dataSourcePcs = new MatTableDataSource<Pc>();
  informeId: string;
  pcsOrEstructuras2: boolean;
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

    combineLatest([allEstructuras$, allPcs$]).subscribe((elem) => {
      this.estConPcs = elem[0].map((est) => {
        const pcs = elem[1].filter((pc) => {
          return pc.archivo === est.archivo;
        });
        return { estructura: est, pcs };
      });

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
  private nextEstructura() {
    const isSameEstructura = (estructuraConPcs: EstructuraConPcs) =>
      estructuraConPcs.estructura.archivo === this.selectedEstructura.archivo;

    const estructurasMismoArchivo = this.estConPcs.filter((est) => {
      return this.selectedEstructura.archivo === est.estructura.archivo;
    }).length;

    const nextEstructuraIndex = 1 + this.dataSourceEst.data.findIndex(isSameEstructura) + estructurasMismoArchivo;
    const nextEstructura = this.dataSourceEst.data[nextEstructuraIndex].estructura;
    this.onClickRowList(nextEstructura);
  }
  private previousEstructura() {
    const isSameEstructura = (estructuraConPcs: EstructuraConPcs) =>
      estructuraConPcs.estructura.archivo === this.selectedEstructura.archivo;
    const prevEstructuraIndex = -1 + this.dataSourceEst.data.findIndex(isSameEstructura);
    const prevEstructura = this.dataSourceEst.data[prevEstructuraIndex].estructura;
    this.onClickRowList(prevEstructura);
  }

  recalcularLocs() {
    this.estConPcs.forEach(async (estConPcs: EstructuraConPcs) => {
      const estructura = estConPcs.estructura;
      let globalCoords;
      let modulo;
      [globalCoords, modulo] = this.plantaService.getGlobalCoordsFromLocationArea(estructura.getLatLng());
      estructura.setModulo(modulo);
      estructura.setGlobals(globalCoords);
      await this.informeService.updateEstructura(this.informeId, estructura);
      estConPcs.pcs.forEach(async (pc) => {
        pc.setLatLng(estructura.getLatLng());
        pc.setGlobals(globalCoords);
        pc.setModulo(modulo);
        await this.pcService.updatePc(pc);
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
