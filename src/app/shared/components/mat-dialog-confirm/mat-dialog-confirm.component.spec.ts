import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogHarness } from '@angular/material/dialog/testing';

import { MatDialogConfirmComponent } from './mat-dialog-confirm.component';

describe('MatDialogConfirmComponent', () => {
  let component: MatDialogConfirmComponent;
  let fixture: ComponentFixture<MatDialogConfirmComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MatDialogConfirmComponent],
      providers: [],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatDialogConfirmComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  // it('Componente MatDialogConfirm creado', () => {
  //   expect(component).toBeTruthy();
  // });

  // describe('metodo closeDialog ', () => {
  //   it('Botón Si acepta dialogo', async () => {
  //     const btnSi = await loader.getHarness<MatButtonHarness>(
  //       MatButtonHarness.with({
  //         selector: '#btnSi',
  //       })
  //     );
  //     const dialog = await loader.getHarness<MatDialogHarness>(
  //       MatDialogHarness.with({
  //         selector: '#content',
  //       })
  //     );

  //     await btnSi.click();

  //     await dialog.close();
  //   });
  // });
});
