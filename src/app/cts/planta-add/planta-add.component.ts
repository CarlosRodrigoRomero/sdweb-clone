import { Component, OnInit } from "@angular/core";
import { PlantaInterface } from "../../models/planta";
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder
} from "@angular/forms";
import { AngularFirestore } from "@angular/fire/firestore";

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
      vertical: [true, [Validators.required]],
      zoom: 18,
      alturaBajaPrimero: true
    });

    this.form.valueChanges.subscribe(console.log);
  }
  async submitForm() {
    this.loading = true;

    const nuevaPlanta = this.form.value;

    try {
      await this.afs.collection("plantas").add(nuevaPlanta);
      this.success = true;
    } catch (err) {
      console.log(err);
    }

    this.loading = false;
  }
}
