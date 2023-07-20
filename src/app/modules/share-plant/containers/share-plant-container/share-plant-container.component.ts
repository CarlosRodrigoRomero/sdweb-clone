import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { PlantaService } from '@data/services/planta.service';
import { ReportControlService } from '@data/services/report-control.service';

import { ShareReportService } from '@data/services/share-report.service';
import { ShareMenuComponent } from '@modules/shared-plants/components/share-menu/share-menu.component';
import { ShareReportDialogComponent } from '@modules/shared-plants/components/share-report-dialog/share-report-dialog.component';
@Component({
  selector: 'app-share-plant-container',
  templateUrl: './share-plant-container.component.html',
  styleUrls: ['./share-plant-container.component.css']
})
export class SharePlantContainerComponent implements OnInit {

  currentPlant;

  currentPlantId;
  constructor(
    public dialog: MatDialog) { }

  ngOnInit(): void {

  }

  openDialog() {

    this.dialog.open(ShareMenuComponent);


  }

}
