import { Component, OnInit } from "@angular/core";
import { PlantaInterface } from "../../models/planta";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { AngularFirestore } from "@angular/fire/firestore";
import { InformeInterface } from "src/app/models/informe";
import { ActivatedRoute } from "@angular/router";
import { PlantaService } from "src/app/services/planta.service";

@Component({
  selector: "app-informe-add",
  templateUrl: "./informe-add.component.html",
  styleUrls: ["./informe-add.component.css"]
})
export class InformeAddComponent implements OnInit {
  informe: InformeInterface;
  form: FormGroup;
  loading: boolean;
  success: boolean;
  plantaId: string;
  planta: PlantaInterface;

  constructor(
    private fb: FormBuilder,
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private plantaService: PlantaService
  ) {
    this.plantaId = this.route.snapshot.paramMap.get("plantaId");
    this.plantaService.getPlanta(this.plantaId).subscribe(planta => {
      this.planta = planta;
    });
  }

  ngOnInit() {
    this.form = this.fb.group({
      plantaId: [this.plantaId, [Validators.required]],
      fecha: [null, [Validators.required]],
      hora_inicio: ["12:00", [Validators.required]],
      hora_fin: ["12:40", [Validators.required]],
      carpeta: ["", [Validators.required]],
      carpetaBase: ["", [Validators.required]],
      alturaVuelo: [23, [Validators.required]],
      gsd: [3, [Validators.required]],
      correccHoraSrt: [8, [Validators.required]],
      emisividad: [0.85, [Validators.required]],
      tempReflejada: [-30, [Validators.required]],
      temperatura: [25, [Validators.required]],
      viento: ["", [Validators.required]],
      velocidad: [10, [Validators.required]],
      nubosidad: [0, [Validators.required]],
      numeroModulos: [this.planta.num_modulos, [Validators.required]]
    });
  }
  async submitForm() {
    this.loading = true;

    const nuevoInforme = this.form.value;

    nuevoInforme.fecha = Math.round(nuevoInforme.fecha.getTime() / 1000);

    try {
      const id = this.afs.createId();
      nuevoInforme.id = id;
      await this.afs
        .collection("informes")
        .doc(id)
        .set(nuevoInforme);
      this.success = true;
    } catch (err) {
      console.log(err);
    }

    this.loading = false;
  }
}
