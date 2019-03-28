import { Component, OnInit, ViewChild, Input, Inject } from '@angular/core';
import { PcInterface } from '../../models/pc';
import { PcService } from '../../services/pc.service';
import { PlantaInterface } from '../../models/planta';
import { ActivatedRoute } from '@angular/router';
import { InformeInterface } from '../../models/informe';
import { AgmMap } from '@agm/core';
import { GLOBAL } from 'src/app/services/global';
import { MatDialog } from '@angular/material';
import { PcDetailsDialogComponent } from '../pc-details-dialog/pc-details-dialog.component';
import { InformeViewComponent } from '../informe-view/informe-view.component';


export interface DialogData {
  pc: PcInterface;
  selectedPc: PcInterface;
}


@Component({
  selector: 'app-pc-map',
  templateUrl: './pc-map.component.html',
  styleUrls: ['./pc-map.component.css']
})

export class PcMapComponent implements OnInit {
  @Input() planta: PlantaInterface;
  @Input() informe: InformeInterface;
  @ViewChild('agm-map') map: AgmMap;


  public filteredPcs: PcInterface[];
  public informeId: string;

  zoom = 16;
  mapType = 'satellite';

  constructor(
    public dialog: MatDialog,
    private pcService: PcService,
    private route: ActivatedRoute
    ) {
      this.informeId = this.route.snapshot.paramMap.get('id');
  }



  ngOnInit() {
    this.pcService.currentFilteredPcs$.subscribe(
      list => {
        console.log('list', list, this.planta);
        this.filteredPcs = list;
        // this.map.triggerResize();
        // this.pcDataSource.filterPredicate = (data, filter) => {
        //   return ['local_id'].some(ele => {
        //     return data[ele].toLowerCase().indexOf(filter) !== -1;
        //   });
        // };
       }
      );
    }

    getStrokeColor(severidad: number) {
      return GLOBAL.colores_severidad[severidad - 1];

    }

    onMapCircleClick(selectedPc: PcInterface): void {
      console.log(selectedPc);
      const dialogRef = this.dialog.open(PcDetailsDialogComponent, {
        width: '1400px',
        height: '600px',
        data: {pc: selectedPc, '{selectedPc}': selectedPc, informe: this.informe }
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
        // this.animal = result;
      });

    }
  }
