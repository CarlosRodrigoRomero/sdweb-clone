import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { ClipboardService } from 'ngx-clipboard';

import { ShareReportService } from '@data/services/share-report.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ParamsFilterShare } from '@core/models/paramsFilterShare';
import { UserService } from '@data/services/user.service';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { UserInterface } from '@core/models/user';
import { AddPlantUserDialogComponent } from '../add-plant-user-dialog/add-plant-user-dialog.component';

@Component({
  selector: 'app-share-menu',
  templateUrl: './share-menu.component.html',
  styleUrls: ['./share-menu.component.css']
})
export class ShareMenuComponent implements OnInit, AfterViewInit, OnDestroy {

  users: UserInterface[];
  displayedColumns: string[] = ['email', 'actions'];
  dataSource = new MatTableDataSource<any>();

  private subscriptions = new Subscription();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('search') search: ElementRef;


  constructor(
    private clipboardService: ClipboardService,
    private shareReportService: ShareReportService,
    private reportControlService: ReportControlService,
    private snackBar: MatSnackBar,
    private userService: UserService,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      this.tipos = data.tipos;
    }
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.userService.getUsersByRoleAndPlanta(2, this.reportControlService.plantaId).subscribe((users) => {
        this.users = users;

        const usersTable: any[] = [];
        users.filter((user) => {
          usersTable.push({ email: user.email, empresa: user.empresaNombre, id: user.uid });
        });
        this.dataSource.data = usersTable;
      })
    );
  }
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.search.nativeElement.focus();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  onlyFiltered = true;
  versionTecnicos = false;

  tipos: number[];



  copyLink() {
    this.clipboardService.copy(this.getShareLink());

    this.openSnackBar();
  }

  private getShareLink(): string {
    // primero comprobamos si hemos recibido un filtro
    if (this.tipos) {
      const params: ParamsFilterShare = this.shareReportService.createRecommendedActionsParams(this.tipos);
      params.informeId = this.reportControlService.selectedInformeId;
      params.plantaId = this.reportControlService.plantaId;
      params.fechaCreacion = this.shareReportService.getCreateDate();
      this.shareReportService.saveParams(params);
    } else {
      this.shareReportService.setSelectedInformeId(this.reportControlService.selectedInformeId);
      this.shareReportService.setCreatedDate();
      this.shareReportService.saveParams();
    }

    // luego recibimos el ID donde se han guardado
    const id = this.shareReportService.getParamsDbId();

    let sharedType: string;
    if (this.versionTecnicos) {
      if (this.reportControlService.plantaFija) {
        sharedType = '/comments-fixed-shared/';
      } else {
        sharedType = '/comments-tracker-shared/';
      }
    } else {
      if (this.reportControlService.plantaFija) {
        sharedType = '/fixed-filterable-shared/';
        if (this.onlyFiltered) {
          sharedType = '/fixed-shared/';
        }
      } else {
        sharedType = '/tracker-filterable-shared/';
        if (this.onlyFiltered) {
          sharedType = '/tracker-shared/';
        }
      }
    }

    const currentUrl = this.reportControlService.getHostname();

    let url;
    if (currentUrl !== 'localhost') {
      url = 'https://' + currentUrl + sharedType + id;
    } else {
      // añadimos el puerto
      url = currentUrl + ':4200' + sharedType + id;
    }

    return url;
  }

  onRemovePlantaButtonClick(userId: string) {
    this.userService.removePlantaFromUser(userId, this.reportControlService.plantaId)
      .then(() => {
        console.log('Planta eliminada con éxito');
      })
      .catch(error => {
        console.error('Error eliminando la planta: ', error);
      });
  }

openAddPlantToUserDialog(){
  this.dialog.open(AddPlantUserDialogComponent);

}
  openSnackBar() {
    this.snackBar.open('Enlace copiado', 'OK', {
      duration: 2000,
    });
  }
}
