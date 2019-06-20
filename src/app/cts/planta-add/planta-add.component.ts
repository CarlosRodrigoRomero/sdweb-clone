import { Component, OnInit } from "@angular/core";
import { PlantaInterface } from "../../models/planta";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { AngularFirestore } from "@angular/fire/firestore";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-planta-add",
  templateUrl: "./planta-add.component.html",
  styleUrls: ["./planta-add.component.css"]
})
export class PlantaAddComponent implements OnInit {
  planta: PlantaInterface;
  form: FormGroup;
  loading: boolean;
  success: boolean;

  constructor(private fb: FormBuilder, private afs: AngularFirestore) {}

  ngOnInit() {
    this.form = this.fb.group({
      nombre: ["", [Validators.required]],
      tipo: ["fija", [Validators.required]],
      longitud: [
        null,
        [Validators.required, Validators.min(-90), Validators.max(90)]
      ],
      latitud: [
        null,
        [Validators.required, Validators.min(-90), Validators.max(90)]
      ],
      potencia: [
        null,
        [Validators.required, Validators.min(0), Validators.max(100)]
      ],
      empresa: ["", [Validators.required]],
      filas: [2, [Validators.required]],
      columnas: [1, [Validators.required]],
      num_modulos: [1, [Validators.required]],
      moduloPotencia: [200, [Validators.required]],
      vertical: [true, [Validators.required]],
      zoom: 18,
      alturaBajaPrimero: true
    });
  }
  async submitForm() {
    this.loading = true;

    const nuevaPlanta = this.form.value;

    try {
      const id = this.afs.createId();
      nuevaPlanta.id = id;
      await this.afs
        .collection("plantas")
        .doc(id)
        .set(nuevaPlanta);
      this.success = true;
    } catch (err) {
      console.log(err);
    }

    this.loading = false;
  }
}
