import { Component, AfterViewInit, ViewChild, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';

import { UserService } from '@data/services/user.service';

import { UserInterface } from '@core/models/user';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogConfirmComponent } from '@shared/components/mat-dialog-confirm/mat-dialog-confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import { AuthService } from '@data/services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit, AfterViewInit, OnDestroy {
  users: UserInterface[];
  displayedColumns: string[] = ['email', 'empresa', 'id', 'actions'];
  dataSource = new MatTableDataSource<any>();
  statusMessage: string;

  private subscriptions = new Subscription();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('search') search: ElementRef;

  constructor(private userService: UserService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private authService: AuthService,
    private http: HttpClient,

  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.userService.getAllUsers().subscribe((users) => {
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

  confirmResetUserPassword(email: string) {
    const dialogRef = this.dialog.open(MatDialogConfirmComponent, {
      data: `Se restablecerá la contraseña del usuario con email "${email}". ¿Desea continuar?`,
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((response: boolean) => {
        if (response) {
          this.resetUserPassword(email);
        }
      });
  }

  cloudFunctionUrl = `${this.authService.firebaseFunctionsUrl}/sendEmail`;

  resetUserPassword(email: string) {
    const payload = {
      email,
      template: 'resetPassword',
    };

    this.http.post(this.cloudFunctionUrl, payload).subscribe(
      () => {
        this.statusMessage = 'Contraseña restablecida.';
        this.openSnackBarMessage("Contraseña del usuario restablecida. El usuario recibirá un email.");
      },
      (error) => {
        this.statusMessage = 'Error al restablecer contraseña.';
        console.error(error);
      }
    );
  }

  openSnackBarMessage(message: string) {
    this.snackBar.open(message, 'OK', { duration: 5000 });
  }


}
