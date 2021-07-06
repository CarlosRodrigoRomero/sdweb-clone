import { Component, Inject, OnInit } from '@angular/core';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-mat-dialog-confirm',
  templateUrl: './mat-dialog-confirm.component.html',
  styleUrls: ['./mat-dialog-confirm.component.css'],
})
export class MatDialogConfirmComponent implements OnInit {
  constructor(
    public dialog: MatDialogRef<MatDialogConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public menssage: string
  ) {}

  ngOnInit(): void {}

  closeDialog(): void {
    this.dialog.close(false);
  }

  confirmDialog(): void {
    this.dialog.close(true);
  }
}
