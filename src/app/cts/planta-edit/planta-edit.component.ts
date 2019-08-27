import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { PlantaInterface } from "../../models/planta";
import { AngularFirestore } from "@angular/fire/firestore";
import { PlantaService } from "src/app/services/planta.service";
import { ModuloInterface } from "../../models/modulo";

@Component({
  selector: "app-planta-edit",
  templateUrl: "./planta-edit.component.html",
  styleUrls: ["./planta-edit.component.css"]
})
export class PlantaEditComponent implements OnInit {
  public plantaId: string;
  public planta: PlantaInterface;
  form: FormGroup;
  loading: boolean;
  success: boolean;
  public modulos: ModuloInterface[];
  public allModulos: ModuloInterface[];

  constructor(
    private plantaService: PlantaService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private afs: AngularFirestore
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.plantaId = this.route.snapshot.paramMap.get("plantaId");
    this.plantaService.getModulos().subscribe(allModulos => {
      this.allModulos = allModulos;
    });

    this.plantaService.getPlanta(this.plantaId).subscribe(planta => {
      this.planta = planta;

      this.form.setValue({
        nombre: planta.nombre,
        tipo: planta.tipo,
        longitud: planta.longitud,
        latitud: planta.latitud,
        potencia: planta.potencia,
        empresa: planta.empresa,
        filas: planta.filas,
        columnas: planta.columnas,
        num_modulos: planta.num_modulos,
        moduloPotencia: planta.moduloPotencia,
        vertical: planta.vertical,
        zoom: planta.zoom,
        alturaBajaPrimero: planta.alturaBajaPrimero
          ? planta.alturaBajaPrimero
          : true,
        id: planta.id,
        modulos: planta.hasOwnProperty("modulos") ? planta.modulos : []
      });
    });
  }
  initializeForm() {
    this.form = this.fb.group({
      nombre: ["", [Validators.required]],
      tipo: ["fija", [Validators.required]],
      longitud: [
        0,
        [Validators.required, Validators.min(-90), Validators.max(90)]
      ],
      latitud: [
        0,
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
      moduloPotencia: [0],
      vertical: [true, [Validators.required]],
      zoom: 18,
      alturaBajaPrimero: true,
      id: null,
      modulos: []
    });
  }

  async submitForm() {
    this.loading = true;

    const planta = this.form.value;
    console.log("TCL: PlantaEditComponent -> submitForm -> planta", planta);

    try {
      this.plantaService.updatePlanta(planta);
    } catch (err) {
      console.log(err);
    }

    this.loading = false;
  }
}
