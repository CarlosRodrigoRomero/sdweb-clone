import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-module-input-dialog',
  templateUrl: './module-input-dialog.component.html',
  styleUrls: ['./module-input-dialog.component.css'],
})
export class ModuleInputDialogComponent implements OnInit {
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<ModuleInputDialogComponent>,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.buildForm(data);
  }

  ngOnInit(): void {}

  private buildForm(data: any) {
    this.form = this.formBuilder.group({
      marca: [, Validators.required],
      potencia: [, Validators.required],
    });

    this.form.patchValue(data);
  }

  onSubmit() {
    if (this.form.valid) {
      this.data = {
        marca: this.form.get('marca').value,
        potencia: this.form.get('potencia').value,
      };

      this.dialogRef.close({ data: this.data });
    }
  }

  close() {
    this.dialogRef.close();
  }
}
