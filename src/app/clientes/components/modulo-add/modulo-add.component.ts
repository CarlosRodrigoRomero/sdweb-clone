import { Component, OnInit } from '@angular/core';
import { ModuloInterface } from '@core/models/modulo';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modulo-add',
  templateUrl: './modulo-add.component.html',
  styleUrls: ['./modulo-add.component.css'],
})
export class ModuloAddComponent implements OnInit {
  modulo: ModuloInterface;
  form: FormGroup;
  loading: boolean;
  success: boolean;

  constructor(private fb: FormBuilder, private afs: AngularFirestore, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      marca: ['', [Validators.required]],
      modelo: '',
      potencia: [0, [Validators.required, Validators.min(0), Validators.max(1000)]],
    });
  }
  async submitForm() {
    this.loading = true;

    const nuevoModulo = this.form.value;

    try {
      const id = this.afs.createId();
      nuevoModulo.id = id;
      await this.afs.collection('modulos').doc(id).set(nuevoModulo);
      this.success = true;
      this.router.navigate(['/clientes']);
    } catch (err) {
      console.log(err);
    }

    this.loading = false;
  }
}
