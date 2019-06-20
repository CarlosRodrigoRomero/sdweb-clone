import { Component, OnInit, ViewChild, ElementRef, Input } from "@angular/core";
import { GLOBAL } from "../../services/global";

import { PcService, SeguidorInterface } from "../../services/pc.service";

import { PcInterface } from "../../models/pc";
import { PlantaInterface } from "../../models/planta";
import { InformeInterface } from "../../models/informe";

import "fabric";
declare let fabric;

import { AngularFireStorage } from "@angular/fire/storage";
import { Observable, BehaviorSubject } from "rxjs";
import { take } from "rxjs/operators";
import { MatCheckboxChange, MatTableDataSource } from "@angular/material";

import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
import { DatePipe, DecimalPipe } from "@angular/common";

pdfMake.vfs = pdfFonts.pdfMake.vfs;
declare var $: any;

export interface PcsTable {
  tipo: string;
  coa1: number;
  coa2: number;
  coa3: number;
  total: number;
}

export interface Apartado {
  nombre: string;
  descripcion: string;
  orden: number;
  elegible: boolean;
  apt?: number;
}

@Component({
  selector: "app-informe-export",
  templateUrl: "./informe-export.component.html",
  styleUrls: ["./informe-export.component.css"],
  providers: [DatePipe, DecimalPipe]
  // providers: [InformeService, PlantaService, PcService]
})
export class InformeExportComponent implements OnInit {
  @ViewChild("content") content: ElementRef;

  @Input() public planta: PlantaInterface;
  @Input() public informe: InformeInterface;

  public titulo: string;
  public irradianciaMinima: number;
  public url: string;
  public dataTipos: any;
  public dataSeveridad: any;
  public numCategorias;
  public numClases;
  public countCategoria;
  public countPosicion;
  public countCategoriaClase;
  public countClase;
  public mae;
  public global;
  public irradianciaImg$: Observable<string | null>;
  public suciedadImg$: Observable<string | null>;
  public portadaImg$: Observable<string | null>;
  public logoImg$: Observable<string | null>;
  public arrayFilas: Array<number>;
  public arrayColumnas: Array<number>;
  public tempReflejada: number;
  public emisividad: number;
  public tipoInforme: string;
  public filteredSeguidores: SeguidorInterface[];
  public seguidor: SeguidorInterface;
  public pcColumnas: any[];
  public filtroColumnas: string[];
  public filtroApartados: string[];
  private filteredColumnasSource = new BehaviorSubject<any[]>(new Array<any>());
  public currentFilteredColumnas$ = this.filteredColumnasSource.asObservable();
  public currentFilteredColumnas: Array<any>;
  public pcDescripcion = GLOBAL.labels_tipos;
  public filteredSeguidores$: Observable<SeguidorInterface[]>;
  public filteredSeguidoresVistaPrevia: SeguidorInterface[];
  public filteredPcsVistaPrevia: PcInterface[];
  public filteredPcs$: Observable<PcInterface[]>;
  public filteredPcs: PcInterface[];
  public currentFiltroGradiente: number;
  public countLoadedImages: number;
  public countSeguidores: number;
  public generandoPDF = false;
  public isLocalhost: boolean;
  public imageList = {};
  public pages;
  public imgIrradianciaBase64: string;
  public imgPortadaBase64: string;
  public imgSuciedadBase64: string;
  public imgFormulaMaeBase64: string;
  public imgCurvaMaeBase64: string;
  public imgLogoBase64: string;
  public progresoPDF: string;
  public informeCalculado: boolean;
  public apartadosInforme: Apartado[];
  public displayedColumns: string[] = [
    "categoria",
    "coa1",
    "coa2",
    "coa3",
    "total"
  ];
  public dataSource: MatTableDataSource<PcsTable>;
  private countLoadedImages$ = new BehaviorSubject(null);

  constructor(
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
    private storage: AngularFireStorage,
    private pcService: PcService
  ) {
    this.numCategorias = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);
    this.numClases = Array(GLOBAL.labels_severidad.length)
      .fill(0)
      .map((_, i) => i + 1);

    this.global = GLOBAL;

    this.informeCalculado = false;

    this.url = GLOBAL.url;
    this.titulo = "Vista de informe";
    this.tipoInforme = "2";
    this.isLocalhost =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";
  }

  ngOnInit() {
    this.progresoPDF = "0";

    this.filteredSeguidores$ = this.pcService.filteredSeguidores$;
    this.filteredPcs$ = this.pcService.currentFilteredPcs$;
    this.pcColumnas = GLOBAL.pcColumnas;

    this.filtroColumnas = this.pcColumnas.map(element => element.nombre);
    this.filteredColumnasSource.next(this.pcColumnas);

    this.currentFilteredColumnas$.subscribe(filteredCols => {
      this.currentFilteredColumnas = filteredCols;
    });

    this.arrayFilas = Array(this.planta.filas)
      .fill(0)
      .map((_, i) => i + 1);
    this.arrayColumnas = Array(this.planta.columnas)
      .fill(0)
      .map((_, i) => i + 1);

    this.irradianciaImg$ = this.storage
      .ref(`informes/${this.informe.id}/irradiancia.png`)
      .getDownloadURL();
    this.suciedadImg$ = this.storage
      .ref(`informes/${this.informe.id}/suciedad.jpg`)
      .getDownloadURL();
    this.portadaImg$ = this.storage
      .ref(`informes/${this.informe.id}/portada.jpg`)
      .getDownloadURL();
    this.logoImg$ = this.storage
      .ref(`informes/${this.informe.id}/logo.jpg`)
      .getDownloadURL();

    this.irradianciaImg$.pipe(take(1)).subscribe(url => {
      fabric.util.loadImage(
        url,
        img => {
          const canvas = new fabric.Canvas("irradianciaImg");
          const scale = canvas.width / img.width;
          const fabricImage = new fabric.Image(img, {
            left: 0,
            top: 0,
            angle: 0,
            opacity: 1,
            scaleX: scale,
            scaleY: scale,
            draggable: false,
            lockMovementX: true,
            lockMovementY: true
          });
          // fabricImage.scale(1);

          canvas.add(fabricImage);
          this.imgIrradianciaBase64 = canvas.toDataURL("image/jpeg", 1);
        },
        null,
        { crossOrigin: "anonymous" }
      );
    });

    this.portadaImg$.pipe(take(1)).subscribe(url => {
      fabric.util.loadImage(
        url,
        img => {
          const canvas = new fabric.Canvas("portadaImg");
          const scale = canvas.width / img.width;
          const fabricImage = new fabric.Image(img, {
            left: 0,
            top: 0,
            angle: 0,
            opacity: 1,
            scaleX: scale,
            scaleY: scale,
            draggable: false,
            lockMovementX: true,
            lockMovementY: true
          });
          // fabricImage.scale(1);
          fabricImage.scaleToWidth(canvas.getWidth());
          canvas.add(fabricImage);
          this.imgPortadaBase64 = canvas.toDataURL("image/jpeg", 0.95);
        },
        null,
        { crossOrigin: "anonymous" }
      );
    });

    this.logoImg$.pipe(take(1)).subscribe(url => {
      fabric.util.loadImage(
        url,
        img => {
          const canvas = new fabric.Canvas("imgLogo");
          const scale = canvas.width / img.width;
          const fabricImage = new fabric.Image(img, {
            left: 0,
            top: 0,
            angle: 0,
            opacity: 1,
            // scaleX: scale,
            // scaleY: scale,
            draggable: false,
            lockMovementX: true,
            lockMovementY: true
          });
          // fabricImage.scale(1);
          // fabricImage.scaleToWidth(canvas.getWidth());
          canvas.add(fabricImage);
          this.imgLogoBase64 = canvas.toDataURL("image/jpeg", 0.85);
        },
        null,
        { crossOrigin: "anonymous" }
      );
    });

    // Obtener pcs vista previa
    this.filteredPcs$.subscribe(pcs => {
      this.filteredPcsVistaPrevia = pcs.slice(0, 20);
      this.filteredPcs = pcs;
      this.currentFiltroGradiente = this.pcService.currentFiltroGradiente;
      this.calcularInforme();
    });
    // Ordenar Pcs por seguidor:
    this.pcService.filteredSeguidores$.subscribe(seguidores => {
      this.filteredSeguidores = seguidores;
      this.filteredSeguidoresVistaPrevia = seguidores.slice(0, 3);
    });

    // this.logoImg$.pipe(take(1)).subscribe( url => {
    //     fabric.util.loadImage(url, (img) => {
    //       const canvas = new fabric.Canvas('imgLogo');
    //       const fabricImage = new fabric.Image(img, {
    //         left: 0,
    //         top: 0,
    //         angle: 0,
    //         opacity: 1,
    //         draggable: false,
    //         lockMovementX: true,
    //         lockMovementY: true
    //       },
    //       );
    //       // fabricImage.scale(1);
    //       fabricImage.scaleToWidth(canvas.getWidth());
    //       canvas.add(fabricImage);
    //       this.imgLogoBase64 = canvas.toDataURL('image/jpeg', 0.95);

    //   }, null, { crossOrigin: 'anonymous'});
    //   });

    this.suciedadImg$.pipe(take(1)).subscribe(url => {
      fabric.util.loadImage(
        url,
        img => {
          const canvas = new fabric.Canvas("imgSuciedad");
          const scale = canvas.width / img.width;
          const fabricImage = new fabric.Image(img, {
            left: 0,
            top: 0,
            angle: 0,
            opacity: 1,
            scaleX: scale,
            scaleY: scale,
            draggable: false,
            lockMovementX: true,
            lockMovementY: true
          });

          canvas.add(fabricImage);
          this.imgSuciedadBase64 = canvas.toDataURL("image/jpeg", 1);
        },
        null,
        { crossOrigin: "anonymous" }
      );
    });

    fabric.util.loadImage(
      "../../../assets/images/maeCurva.png",
      img => {
        const canvas = new fabric.Canvas("imgCurvaMae");
        const scale = canvas.width / img.width;
        const fabricImage = new fabric.Image(img, {
          left: 0,
          top: 0,
          angle: 0,
          opacity: 1,
          scaleX: scale,
          scaleY: scale,
          draggable: false,
          lockMovementX: true,
          lockMovementY: true
        });

        canvas.add(fabricImage);
        this.imgCurvaMaeBase64 = canvas.toDataURL("image/jpeg", 1);
      },
      null,
      { crossOrigin: "anonymous" }
    );

    fabric.util.loadImage(
      "../../../assets/images/formula_mae.png",
      img => {
        const canvas = new fabric.Canvas("imgFormulaMae");
        const scale = canvas.width / img.width;
        const fabricImage = new fabric.Image(img, {
          left: 0,
          top: 0,
          angle: 0,
          opacity: 1,
          scaleX: scale,
          scaleY: scale,
          draggable: false,
          lockMovementX: true,
          lockMovementY: true
        });

        canvas.add(fabricImage);
        this.imgFormulaMaeBase64 = canvas.toDataURL("image/jpeg", 0.95);
      },
      null,
      { crossOrigin: "anonymous" }
    );

    this.apartadosInforme = [
      {
        nombre: "introduccion",
        descripcion: "Introducción",
        orden: 1,
        apt: 1,
        elegible: false
      },
      {
        nombre: "criterios",
        descripcion: "Criterios de operación",
        orden: 2,
        apt: 1,
        elegible: true
      },
      {
        nombre: "normalizacion",
        descripcion: "Normalización de gradientes de temperatura",
        orden: 3,
        apt: 1,
        elegible: true
      },
      {
        nombre: "datosVuelo",
        descripcion: "Datos del vuelo",
        orden: 4,
        apt: 1,
        elegible: true
      },
      {
        nombre: "irradiancia",
        descripcion: "Irradiancia durante el vuelo",
        orden: 5,
        apt: 1,
        elegible: true
      },
      {
        nombre: "paramsTermicos",
        descripcion: "Ajuste de parámetros térmicos",
        orden: 6,
        apt: 1,
        elegible: true
      },
      {
        nombre: "perdidaPR",
        descripcion: "Pérdida de Performance Ratio",
        orden: 7,
        apt: 1,
        elegible: true
      },
      {
        nombre: "clasificacion",
        descripcion: "Cómo se clasifican las anomalías",
        orden: 8,
        apt: 1,
        elegible: true
      },
      {
        nombre: "localizar",
        descripcion: "Cómo localizar las anomalías",
        orden: 9,
        apt: 1,
        elegible: true
      },
      {
        nombre: "resultadosClase",
        descripcion: "Resultados por clase",
        orden: 10,
        apt: 2,
        elegible: true
      },
      {
        nombre: "resultadosCategoria",
        descripcion: "Resultados por categoría",
        orden: 11,
        apt: 2,
        elegible: true
      },
      {
        nombre: "resultadosPosicion",
        descripcion: "Resultados por posición",
        orden: 12,
        apt: 2,
        elegible: true
      },
      {
        nombre: "resultadosMAE",
        descripcion: "MAE de la planta",
        orden: 13,
        apt: 2,
        elegible: true
      },
      {
        nombre: "anexo1",
        descripcion: "Anexo I: Listado resumen de anomalías",
        orden: 14,
        elegible: true
      }
    ];

    if (this.planta.tipo === "2 ejes") {
      this.apartadosInforme.push({
        nombre: "anexo2",
        descripcion: "Anexo II: Anomalías por seguidor",
        orden: 15,
        elegible: true
      });
    }

    this.apartadosInforme = this.apartadosInforme.sort(
      (a: Apartado, b: Apartado) => {
        return a.orden - b.orden;
      }
    );

    this.filtroApartados = this.apartadosInforme.map(element => element.nombre);
  }

  private calcularInforme() {
    this.countCategoria = Array();
    this.countCategoriaClase = Array();
    this.countClase = Array();
    this.countPosicion = Array();

    this.informeCalculado = false;
    const allPcs = this.filteredPcs;
    allPcs.sort(this.compare);
    if (allPcs.length > 0) {
      this.irradianciaMinima = Math.round(
        allPcs.sort(this.compareIrradiancia)[0].irradiancia
      );
    } else {
      this.irradianciaMinima = 800;
    }
    
    this.emisividad = this.informe.emisividad;
    this.tempReflejada = this.informe.tempReflejada;

    // Calcular las alturas

    for (const y of this.arrayFilas) {
      const countColumnas = Array();
      for (const x of this.arrayColumnas) {
        if (this.planta.tipo === "2 ejes") {
          countColumnas.push(
            allPcs.filter(pc => pc.local_x === x && pc.local_y === y).length
          );
        } else {
          countColumnas.push(allPcs.filter(pc => pc.local_y === y).length);
        }
        this.countPosicion.push(countColumnas);
      }
    }

    // CATEGORIAS //
    let filtroCategoria;
    let filtroCategoriaClase;
    for (const cat of this.numCategorias) {
      filtroCategoria = allPcs.filter(pc => pc.tipo === cat);
      this.countCategoria.push(filtroCategoria.length);

      let count1 = Array();
      for (const clas of this.numClases) {
        filtroCategoriaClase = allPcs.filter(
          pc => pc.severidad === clas && pc.tipo === cat
        );
        count1.push(filtroCategoriaClase.length);
      }
      const totalPcsInFilter = count1[0] + count1[1] + count1[2];
      if (totalPcsInFilter > 0) {
        this.countCategoriaClase.push({
          categoria: this.pcDescripcion[cat],
          coa1: count1[0],
          coa2: count1[1],
          coa3: count1[2],
          total: totalPcsInFilter
        });
      }
    }

    // CLASES //
    let filtroClase;
    for (const j of this.numClases) {
      filtroClase = allPcs.filter(pc => pc.severidad === j);

      this.countClase.push(filtroClase.length);
    }

    this.informeCalculado = true;
    this.dataSource = new MatTableDataSource(this.countCategoriaClase);
  }

  public calificacionMae(mae: number) {
    if (mae <= 0.1) {
      return "muy bueno";
    } else if (mae <= 0.2) {
      return "correcto";
    } else {
      return "mejorable";
    }
  }

  // Ordena los pcs por localizacion
  compare(a: PcInterface, b: PcInterface) {
    if (a.global_x < b.global_x) {
      return -1;
    }
    if (a.global_x > b.global_x) {
      return 1;
    }
    return 0;
  }
  compareIrradiancia(a: PcInterface, b: PcInterface) {
    if (a.irradiancia < b.irradiancia) {
      return -1;
    }
    if (a.irradiancia > b.irradiancia) {
      return 1;
    }
    return 0;
  }

  public downloadPDF() {
    this.generandoPDF = true;
    this.countLoadedImages$ = new BehaviorSubject(null);

    const imageListBase64 = {};
    this.countLoadedImages = 0;
    this.countSeguidores = 1;

    if (this.filtroApartados.includes("anexo2")) {
      this.countLoadedImages$.subscribe(globalX => {
        if (globalX !== null) {
          const canvas = $(
            `canvas[id="imgSeguidorCanvas${globalX}"]`
          )[0] as HTMLCanvasElement;
          imageListBase64[`imgSeguidorCanvas${globalX}`] = canvas.toDataURL(
            "image/jpeg",
            1
          );
          this.progresoPDF = this.decimalPipe.transform(
            (100 * this.countLoadedImages) / this.countSeguidores,
            "1.0-0"
          );

          // Si todo va bien...
          if (this.countLoadedImages === this.countSeguidores) {
            this.pcService.currentFilteredPcs$
              .pipe(take(1))
              .subscribe(filteredPcs => {
                this.filteredPcs = filteredPcs;
                this.calcularInforme();

                const pdfDocGenerator = pdfMake.createPdf(
                  this.getDocDefinition(imageListBase64)
                );

                pdfDocGenerator.download();
                // pdfDocGenerator.getDataUrl((dataUrl) => {
                //     const iframe = document.createElement('iframe');
                //     iframe.src = dataUrl;
                //     iframe.setAttribute('style', 'position:absolute;right:0; top:0; bottom:0; height:100%; width:650px; padding:20px;');
                //     document.getElementById('vistaPrevia').appendChild(iframe);
                // });
                this.generandoPDF = false;
              });

            // pdfMake.createPdf(dd).download();
            // this.generandoPDF = false;
          }
        }
      });
    } else {
      this.pcService.currentFilteredPcs$
        .pipe(take(1))
        .subscribe(filteredPcs => {
          this.filteredPcs = filteredPcs;
          this.calcularInforme();

          const pdfDocGenerator = pdfMake.createPdf(
            this.getDocDefinition(imageListBase64)
          );

          pdfDocGenerator.download();
          // pdfDocGenerator.getDataUrl((dataUrl) => {
          //     const iframe = document.createElement('iframe');
          //     iframe.src = dataUrl;
          //     iframe.setAttribute('style', 'position:absolute;right:0; top:0; bottom:0; height:100%; width:650px; padding:20px;');
          //     document.getElementById('vistaPrevia').appendChild(iframe);
          // });
          this.generandoPDF = false;
        });
    }

    // Generar imagenes
    if (this.filtroApartados.includes("anexo2")) {
      this.countSeguidores = 0;
      for (const seguidor of this.filteredSeguidores) {
        this.setImgSeguidorCanvas(seguidor, false);
        this.countSeguidores++;
      }
    }
  }

  private setImgSeguidorCanvas(
    seguidor: SeguidorInterface,
    vistaPrevia: boolean = false
  ) {
    const seguidorObs = this.storage
      .ref(`informes/${this.informe.id}/jpg/${seguidor.pcs[0].archivoPublico}`)
      .getDownloadURL();
    seguidorObs.pipe(take(1)).subscribe(url => {
      seguidor.pcs[0].downloadUrlString = url;
      // imagenTermica.src = url;

      let canvas = new fabric.Canvas(`imgSeguidorCanvas${seguidor.global_x}`);
      if (vistaPrevia) {
        canvas = new fabric.Canvas(`imgSeguidorCanvasVP${seguidor.global_x}`);
      }

      fabric.util.loadImage(
        url,
        img => {
          const fabricImage = new fabric.Image(img, {
            left: 0,
            top: 0,
            angle: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            draggable: false,
            lockMovementX: true,
            lockMovementY: true
          });
          // fabricImage.scale(1);
          canvas.add(fabricImage);
          this.drawAllPcsInCanvas(seguidor, canvas, vistaPrevia);

          if (!vistaPrevia) {
            this.countLoadedImages++;
            this.countLoadedImages$.next(seguidor.global_x);
          }
        },
        null,
        { crossOrigin: "anonymous" }
      );
      // // this.imageList[globalX.toString()] = imageBase64;
      // // images[`imgSeguidorCanvas${globalX}`] = imageBase64;
    });
  }

  drawAllPcsInCanvas(
    seguidor: SeguidorInterface,
    canvas,
    vistaPrevia: boolean = false
  ) {
    seguidor.pcs.forEach((pc, i, a) => {
      this.drawPc(pc, canvas);
      this.drawTriangle(pc, canvas);
    });
    // canvas.getElement().toBlob( (blob) => {

    //   const urlCreator = window.URL;
    //   const imageUrl = urlCreator.createObjectURL(blob);
    //   const image = new Image();
    //   image.src = imageUrl;
    //   image.width = 640;
    //   image.height = 512;
    //   const list = document.getElementById(`divSeguidorVP${seguidor.global_x}`);

    //   // list.removeChild(list[0]);
    //   list.appendChild(image);
    // },
    // 'image/jpeg',
    // 0.95 // calidad
    // );
  }

  drawPc(pc: PcInterface, canvas: any) {
    const actObj1 = new fabric.Rect({
      left: pc.img_left,
      top: pc.img_top,
      fill: "rgba(0,0,0,0)",
      stroke: "black",
      strokeWidth: 1,
      width: pc.img_width,
      height: pc.img_height,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      localId: pc.local_id,
      ref: false,
      selectable: false,
      hoverCursor: "default"
    });
    const actObj2 = new fabric.Rect({
      left: pc.img_left - 1,
      top: pc.img_top - 1,
      fill: "rgba(0,0,0,0)",
      stroke: "red",
      strokeWidth: 1,
      width: pc.img_width + 2,
      height: pc.img_height + 2,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      localId: pc.local_id,
      ref: false,
      hoverCursor: "pointer",
      selectable: true
    });
    const textId = new fabric.Text(
      "#".concat(pc.local_id.toString().concat(" ")),
      {
        left: pc.img_left,
        top: pc.img_top - 26,
        fontSize: 20,
        // textBackgroundColor: 'red',
        ref: "text",
        selectable: false,
        hoverCursor: "default",
        fill: "white"
      }
    );

    canvas.add(actObj1);
    canvas.add(actObj2);
    canvas.add(textId);
    canvas.renderAll();
  }

  private drawTriangle(pc: PcInterface, canvas: any) {
    const x = pc.img_x;
    const y = pc.img_y;

    const squareBase = 12;
    const triangle = new fabric.Triangle({
      width: squareBase,
      height: squareBase,
      fill: "red",
      stroke: "black",
      left: Math.round(x - squareBase / 2),
      top: y, // si no ponemos este 2, entonces no lee bien debajo del triangulo
      selectable: false,
      ref: "triangle",
      hoverCursor: "default"
    });

    const textTriangle = new fabric.Text(
      " + ".concat(pc.gradienteNormalizado.toString().concat(" ºC ")),
      {
        left: pc.img_left,
        top: pc.img_top + pc.img_height + 5,
        fontSize: 22,
        textBackgroundColor: "white",
        ref: "text",
        selectable: false,
        hoverCursor: "default",
        fill: "red"
      }
    );

    canvas.add(triangle);
    // canvas.add(textTriangle);
    canvas.renderAll();
  }

  onCheckBoxColumnaChange($event: MatCheckboxChange) {
    const columnaChecked = $event.source.value;
    this.filtroColumnas = this.filtroColumnas.filter(
      nombre => nombre !== columnaChecked
    );
    if ($event.checked === true) {
      this.filtroColumnas.push(columnaChecked);
    }

    // Llamar al behaviourObject
    this.filteredColumnasSource.next(
      this.pcColumnas.filter(e => this.filtroColumnas.includes(e.nombre))
    );
  }
  onCheckBoxApartadosChange($event: MatCheckboxChange) {
    const apartadoChecked = $event.source.value;
    this.filtroApartados = this.filtroApartados.filter(
      nombre => nombre !== apartadoChecked
    );
    if ($event.checked === true) {
      this.filtroApartados.push(apartadoChecked);
    }
  }

  onClickTipoInforme() {
    if (this.tipoInforme === "2") {
      // let count = 0;
      for (const seguidor of this.filteredSeguidoresVistaPrevia) {
        this.setImgSeguidorCanvas(seguidor, true);
        // count = count + 1;
        // if ( count === 5 ) {
        //   break;
        // }
      }
    }
  }

  //  ###################  CONTENIDO ##################################

  private getTablaCategoria() {
    const array = [];
    for (const i of this.numCategorias) {
      if (this.countCategoria[i - 1] > 0) {
        array.push(
          new Array(
            {
              text: this.global.pcDescripcion[i]
            },
            {
              text: this.countCategoria[i - 1]
            },
            {
              text:
                this.decimalPipe
                  .transform(
                    (this.countCategoria[i - 1] / this.filteredPcs.length) *
                      100,
                    "1.0-1"
                  )
                  .toString() + " %"
            }
          )
        );
      }
    }

    return array;
  }

  private getTablaPosicion = function() {
    const array = [];
    const arrayHeader = [];
    arrayHeader.push({});

    for (const i of this.arrayColumnas) {
      arrayHeader.push({
        text: this.getAltura(i.toString()),
        style: "tableHeaderRed"
      });
    }

    array.push(arrayHeader);

    for (const j of this.arrayFilas) {
      const arrayFila = [];
      arrayFila.push({
        text: j.toString(),
        style: "tableHeaderRed"
      });
      const countPosicionFila = this.countPosicion[j - 1];
      for (const i of this.arrayColumnas) {
        arrayFila.push({
          text: countPosicionFila[i - 1].toString(),
          style: "tableCell"
        });
      }

      array.push(arrayFila);
    }

    return array;
  };

  private getTextoIrradiancia() {
    if (this.informe.irradiancia === 0) {
      return `Los datos de irradiancia durante el vuelo han sido obtenidos de la estación meteorológica de la propia planta de ${
        this.planta.nombre
      }, los cuales han sido suministrados a nuestro software para ser emparejados con las imágenes termográficas tomadas desde el aire, de manera que cada imagen tiene una irradiancia asociada. Dicha irradiancia es la más cercana en el tiempo de las registradas.`;
    } else {
      return "Los datos de irradiancia durante el vuelo han sido obtenidos de los instrumentos de medición que Solardrone ha llevado a planta, los cuales han sido suministrados a nuestro software para ser emparejados con las imágenes termográficas tomadas desde el aire, de manera que cada imagen tiene una irradiancia asociada. Dicha irradiancia es la más cercana en el tiempo de las registradas.";
    }
  }

  private getTextoLocalizar() {
    if (this.planta.tipo === "2 ejes") {
      return "Además todos ellos tienen asociado los parámetros seguidor”, “fila” y “columna” según el mapa habitual de la planta. Las filas y las columnas tienen origen en la esquina superior izquierda del seguidor.";
    } else {
      return 'Además todos ellos tienen asociado los parámetros "pasillo", "columna" y "altura" según el mapa habitual de la planta.';
    }
  }

  getPagesPDF() {
    // PORTADA //
    const portada: any[] = [
      {
        text: "Análisis termográfico aéreo de módulos fotovoltaicos",
        style: "h1",
        alignment: "center"
      },

      "\n",

      {
        image: this.imgPortadaBase64,
        width: 600,
        alignment: "center"
      },

      "\n",

      {
        text: [
          {
            text: `Planta solar: `,
            style: "bold"
          },
          `${this.planta.nombre} (${this.planta.potencia} MW - ${
            this.planta.tipo
          })`
        ],
        style: "subtitulo"
      },

      {
        text: [
          {
            text: `Fecha del vuelo: `,
            style: "bold"
          },
          this.datePipe.transform(this.informe.fecha * 1000, "dd/MM/yyyy")
        ],
        style: "subtitulo"
      },

      "\n\n",

      {
        image: this.imgLogoBase64,
        width: 300,
        alignment: "center",
        pageBreak: "after"
      }
    ];

    const introduccion = (index: string) => {
      return [
        {
          text: `Este documento contiene los resultados de la inspección termográfica realizada en la planta solar fotovoltaica de ${
            this.planta.nombre
          } de ${this.planta.potencia} MW (${this.planta.tipo}).`,
          style: "p"
        },

        "\n",

        {
          text:
            "Las inspecciones termográficas en instalaciones solares fotovoltaicas forman parte del mantenimiento preventivo recomendado para este tipo de instalaciones y tienen como objetivo anticiparse a aquellos problemas en los paneles que no son detectables fácilmente de otra manera.",
          style: "p"
        },

        "\n",

        {
          text:
            "Es importante que este mantenimiento sea llevado a cabo por profesionales, ya que una termografía mal realizada durante varios años puede afectar al estado general de la planta.",
          style: "p"
        },

        "\n",

        {
          text:
            "Entre las ventajas de realizar termografía infrarroja de manera regular: permite aumentar la eficiencia de la planta (performance ratio) en el medio plazo, evitar reparaciones más costosas, aumentar la vida útil de los equipos, detectar problemas relacionados con distintos fabricantes de paneles, problemas de conexión entre módulos, problemas relacionados con la vegetación o la suciedad en los módulos... entre una larga lista de ventajas.",
          style: "p"
        },

        "\n",

        {
          text:
            "La inspección ha sido realizada mediante vehículos aéreos no tripulados operados y diseñados a tal efecto por Solardrone. Se ha utilizado la más avanzada tecnología al servicio de la fotovoltaica con el fin de reducir al mínimo el tiempo y el coste de operación sin renunciar a la más alta calidad y fiabilidad.  El equipo de que ha realizado el presente documento cuenta con personal formado en Termografía Infrarroja Nivel 1 y lleva realizando termografías aéreas desde 2015, habiendo volado más de 500 MW.",
          style: "p"
        },

        "\n\n"
      ];
    };

    const criterios = (index: string) => {
      return [
        {
          text: `${index} - Criterios de operación`,
          style: "h3"
        },

        "\n",

        {
          text:
            "El criterio base que Solardrone sigue para realizar inspecciones termográficas es la norma internacional para inspecciones termográficas IEC 62446-3. En la misma se define las termografías infrarrojas de módulos fotovoltaicos en plantas durante su operación",
          style: "p"
        },

        "\n",

        {
          text:
            "Hay dos niveles de inspección termográfica según la norma IEC 62446-3:",
          style: "p"
        },

        "\n",

        {
          ul: [
            {
              text: [
                {
                  text: "Inspección simplificada",
                  bold: true
                },
                ": Esta es una inspección limitada para verificar que los módulos están funcionando, con requisitos reducidos para el personal. Este tipo de inspecciones se usan, por ejemplo, durante una puesta en marcha básica de una planta fotovoltaica.\n\n"
              ],
              style: "p"
            },
            {
              text: [
                {
                  text: "Inspección detallada",
                  bold: true
                },
                ": Requiere una comprensión más profunda de las anomalías térmicas. Puede ser utilizado para inspecciones periódicas de acuerdo con a la serie IEC 62446 y para solucionar problemas en sistemas con un bajo rendimiento. Se realizan mediciones de temperatura absoluta. Un experto autorizado en plantas fotovoltaicas, junto con exportos termógrafos, pueden llevar a cabo este tipo de inspecciones."
              ],
              style: "p"
            }
          ]
        },

        "\n",

        {
          text:
            "Las termografías realizadas por Solardrone entran dentro de las inspecciones detalladas indicadas por la norma, cumpliendo con los requisitos que indica la misma, que son:",
          style: "p"
        },

        "\n",

        {
          ul: [
            {
              text:
                "Medición absoluta de temperaturas: con un error menor de 2 ºC.",
              style: "p"
            },
            {
              text: "Medición de temperatura máxima, media y gradiente.",
              style: "p"
            },
            {
              text:
                "Informe realizado por un experto en termografía infrarroja en conjunto con un experto en fotovoltaica.",
              style: "p"
            },
            {
              text: "Recomendación para cada tipo de anomalía registrada.",
              style: "p"
            },
            {
              text:
                "Resolución geométrica térmica: 5x5 pixels por cada célula fotovoltaica.",
              style: "p"
            },
            {
              text:
                "Resolución geométrica visual: 25x25 pixels por cada célula fotovoltaica.",
              style: "p"
            },
            {
              text:
                "Condiciones ambientales correctas: temperatura ambiente, viento, nubosidad e irradiancia.",
              style: "p"
            },
            {
              text: "Calibración de los equipos: cada 2 años.",
              style: "p"
            },
            {
              text:
                "Parámetros térmicos: el ajuste de la emisividad y la temperatura reflejada es imprescindible para una correcta medición de las temperaturas. Es necesario hacer las mediciones oportunas en campo para poder obtener estos parámetros, ya que dependen de la atmósfera, la meteorología, la suciedad en los módulos el día del vuelo y de los materiales del propio módulo.",
              style: "p"
            },
            {
              text:
                "Documentación: el entregable incluye las imágenes radiométricas y visuales originales junto con todos los datos que requiere la norma. ",
              style: "p"
            },
            {
              text: "Trayectoria: que asegure el cumplimiento de la norma.",
              style: "p"
            },
            {
              text: "Velocidad: 10 km/h máximo.",
              style: "p"
            }
          ]
        },

        "\n",

        {
          text: "\n\n"
        }
      ];
    };

    const normalizacion = (index: string) => {
      return [
        {
          text: `${index} - Normalización de gradientes de temperatura`,
          style: "h3"
        },

        "\n",

        {
          text: [
            "Con el fin de poder ver la ",
            {
              text: "evolución de las anomalías térmicas con el tiempo",
              style: "bold"
            },
            " comparando inspecciones termográficas llevadas a cabo en distintos meses o años (con condiciones ambientales distintas), es necesario contar con un procedimiento que permita normalizar los gradientes de temperatura."
          ],
          style: "p"
        },

        "\n",

        {
          text:
            'Por este motivo todas las anomalías registradas tienen asociada su "gradiente normalizado", que es el gradiente de temperatura equivalente a haber realizado la inspección con una irradiancia de 1000 W/m2. Esto permitirá poder comparar los resultados de la presente inspección con otras futuras realizadas en condiciones ambientales diferentes y así poder tener una evolución fidedigna de cada una de las anomalías.',
          style: "p"
        },

        "\n\n"
      ];
    };

    const datosVuelo = (index: string) => {
      return [
        {
          text: `${index} - Datos del vuelo`,
          style: "h3"
        },

        "\n",

        {
          text: "Las condiciones durante le vuelo han sido las siguientes:",
          style: "p"
        },

        "\n",

        {
          columns: [
            {
              width: "*",
              text: ""
            },

            {
              width: "auto",
              table: {
                body: [
                  [
                    {
                      text: "Vehículo aéreo no tripulado",
                      style: "tableHeaderRed",
                      colSpan: 2,
                      alignment: "center"
                    },
                    {}
                  ],
                  [
                    {
                      text: "Aeronave",
                      style: "tableLeft"
                    },
                    {
                      text: `${this.global.uav}`
                    }
                  ],
                  [
                    {
                      text: "Cámara térmica",
                      style: "tableLeft"
                    },
                    {
                      text: `${this.global.camaraTermica}`
                    }
                  ],
                  [
                    {
                      text: "Última calibración",
                      style: "tableLeft"
                    },
                    {
                      text: `${this.global.ultimaCalibracion}`
                    }
                  ],

                  [
                    {
                      text: "Datos del vuelo",
                      style: "tableHeaderRed",
                      colSpan: 2,
                      alignment: "center"
                    },
                    {}
                  ],

                  [
                    {
                      text: "Fecha",
                      style: "tableLeft"
                    },
                    {
                      text: this.datePipe.transform(
                        this.informe.fecha * 1000,
                        "dd/MM/yyyy"
                      )
                    }
                  ],

                  [
                    {
                      text: "Horario de los vuelos",
                      style: "tableLeft"
                    },
                    {
                      text: `${this.informe.hora_inicio} - ${
                        this.informe.hora_fin
                      }`
                    }
                  ],

                  [
                    {
                      text: "Velocidad",
                      style: "tableLeft"
                    },
                    {
                      text: `${this.informe.velocidad} km/h`
                    }
                  ],

                  [
                    {
                      text: "GSD térmico (máx)",
                      style: "tableLeft"
                    },
                    {
                      text: `${this.informe.gsd} cm/pixel`
                    }
                  ],

                  [
                    {
                      text: "GSD visual",
                      style: "tableLeft"
                    },
                    {
                      text: `${Math.round(this.informe.gsd * 0.16 * 100) /
                        100} cm/pixel`
                    }
                  ],

                  [
                    {
                      text: "Datos meteorológicos",
                      style: "tableHeaderRed",
                      colSpan: 2,
                      alignment: "center"
                    },
                    {}
                  ],

                  [
                    {
                      text: "Irradiancia (mínima)",
                      style: "tableLeft"
                    },
                    {
                      text: `${this.irradianciaMinima} W/m2`
                    }
                  ],

                  [
                    {
                      text: "Temperatura ambiente",
                      style: "tableLeft"
                    },
                    {
                      text: `${this.informe.temperatura} ºC`
                    }
                  ],

                  [
                    {
                      text: "Nubosidad",
                      style: "tableLeft"
                    },
                    {
                      text: `${this.informe.nubosidad} octavas`
                    }
                  ]
                ]
              }
            },

            {
              width: "*",
              text: ""
            }
          ]
        },

        "\n\n"
      ];
    };

    const irradiancia = (index: string) => {
      return [
        {
          text: `${index} - Irradiancia durante el vuelo`,
          style: "h3"
        },

        "\n\n",

        {
          text: this.getTextoIrradiancia(),
          style: "p"
        },

        "\n",

        {
          image: this.imgIrradianciaBase64,
          width: 500,
          alignment: "center"
        },

        "\n\n"
      ];
    };

    const paramsTermicos = (index: string) => {
      return [
        {
          text: `${index} - Ajuste de parámetros térmicos`,
          style: "h3"
        },

        "\n",

        {
          text: [
            "Con el fin de obtener medidas de temperaturas absolutas fiables, es necesario tener en cuenta distintas variables térmicas que afectan directamente al resultado de las medidas obtenidas por las cámaras. Las más importantes son ",
            {
              text: "la emisividad",
              style: "bold"
            },
            " y la ",
            {
              text: "temperatura reflejada",
              style: "bold"
            },
            "."
          ],
          style: "p"
        },

        "\n",

        {
          text: `${index}.1 - Emisividad`,
          style: "h4"
        },

        "\n",

        {
          text:
            "La emisividad del material se mide de manera experimental en campoy y depende del tipo de vidrio de los módulos y de la suciedad que presenten el día del vuelo. La emisividad escogida por el termógrafo tras el ensayo experimental es la siguiente:",
          style: "p"
        },

        "\n",

        {
          text: "Emisividad = " + this.informe.emisividad.toString(),
          style: "param"
        },

        "\n",

        // Imagen suciedad
        {
          image: this.imgSuciedadBase64,
          width: 500,
          alignment: "center"
        },

        "\n\n",

        {
          text: `${index}.2 - Temperatura reflejada`,
          style: "h4"
        },

        "\n",

        {
          text:
            "La temperatura reflejada nos depende de la atmosfera y las condiciones meteorológicas del día del vuelo. Para obtener este parámetro es necesario llevar a cabo un procedimiento de medición adecuado en la misma planta el mismo día del vuelo. La temperatura reflejada medida es:",
          style: "p"
        },

        "\n",

        {
          text:
            "Temperatura reflejada = " +
            this.informe.tempReflejada.toString() +
            " ºC",
          style: "param"
        },

        "\n\n"
      ];
    };

    const perdidaPR = (index: string) => {
      return [
        {
          text: `${index} - Pérdida de Performance Ratio (ΔPR)`,
          style: "h3"
        },

        "\n",

        {
          text:
            "El coeficiente de rendimiento de sistemas fotovoltaicos o Performance Ratio es un parámetro que tuvo su origen conceptual en la norma IES 61724 (1998) para ser utilizado como indicador de calidad en la evaluación de sistemas fotovoltaicos.\n\n",
          style: "p"
        },

        {
          text:
            "Este parámetro se utiliza para medir el rendimiento de cualquier sistema fotovoltaico. En otras palabras, si queremos saber si un módulo está generando la energía que debería bastaría con conocer su PR. No podemos conocer el PR de cada módulo con una termografía, pero lo que sí podemos conocer es la pérdida de PR (ΔPR) producida por anomalía térmica respecto a sus condiciones ideales. Es decir, un módulo con un punto caliente que causa una ΔPR = -1% tiene menos importancia que una anomalía que causa una ΔPR = -33%, el cual está haciendo caer la producción eléctrica del módulo en un 33%.",
          style: "p"
        },

        "\n",

        {
          text:
            "La pérdida de PR nos indica, por tanto, lo perjudicial que es una anomalía térmica, identificando explícitamente los puntos sobre los que se debe actuar para optimizar la producción eléctrica. Es un parámetro indispensable en el diagnóstico termográfico de una instalación fotovoltaica, ya que nos permite tomar decisiones en base a un dato técnico-económico objetivo.",
          style: "p"
        },

        "\n",

        {
          text:
            "Para poder evaluar la planta utilizaremos los siguientes dos sencillos conceptos:",
          style: "p"
        },

        "\n",

        {
          text: `${index}.1 - Pérdidas de performance ratio (ΔPR)`,
          style: "h4"
        },

        "\n",

        {
          text:
            "Cada incidencia tiene una variación de performance ratio asociado. Por ejemplo, un diodo bypass en circuito abierto produce que el módulo trabaje al 15% de eficiencia en un caso típico (ΔPR=85%), mientras que una célula caliente aislada produce de media < 1% de pérdidas.",
          style: "p"
        },

        "\n",

        {
          text: `${index}.2 - Módulos apagados equivalentes`,
          style: "h4"
        },

        "\n",

        {
          text:
            "El concepto “módulos apagados equivalentes” es la cantidad equivalente de módulos que no generan energía debido a las incidencias registradas en la planta. Por ejemplo, si tenemos tres módulos idénticos con un defecto en un diodo bypass cada uno, cada módulo genera un 33% menos de energía. Entonces, el número de módulos apagados equivalentes es 1.",
          style: "p"
        },

        {
          text:
            "Uniendo los dos conceptos anteriores, se puede hacer una estimación “grosso modo” de la variación de PR de la planta de la siguiente manera:",
          style: "p"
        },

        {
          image: this.imgFormulaMaeBase64,
          width: 350,
          alignment: "center"
        },

        {
          text:
            "Siendo N = Número de módulos; PR = Performance ratio; MAE = Módulos apagados equivalente calculados",
          style: "pieFoto"
        },

        "\n\n",

        {
          text:
            "Por lo tanto, sabiendo el MAE sabremos cuánto PR estamos perdiendo debido a las incidencias encontradas.",
          style: "p"
        },

        "\n",

        {
          text:
            "El objetivo será obtener un MAE bajo, lo cual nos indicará un correcto mantenimiento de la planta.",
          style: "p"
        },

        "\n",

        {
          text:
            'Teniendo en cuenta todas las plantas fotovoltaicas inspeccionadas por Solardrone, se puede hacer una clasificación estadística según el MAE. Según la siguiente tabla, podemos clasificar el mantenimiento de una planta en 3 tipos: muy bueno (por debajo de la media), correcto (en la media) y "mejorable" (por encima de la media):',
          style: "p"
        },

        "\n",

        // Imagen maeCurva
        {
          image: this.imgCurvaMaeBase64,
          width: 250,
          alignment: "center"
        },

        "\n\n",

        {
          columns: [
            {
              width: "*",
              text: ""
            },

            {
              width: "auto",
              table: {
                body: [
                  [
                    {
                      text: "MAE de la planta",
                      style: "tableHeader"
                    },
                    {
                      text: "Estado",
                      style: "tableHeader"
                    }
                  ],
                  [
                    {
                      text: "% MAE < " + this.global.mae[0],
                      style: ["mae1", "bold"]
                    },
                    {
                      text: "Muy bueno",
                      style: "mae1"
                    }
                  ],
                  [
                    {
                      text:
                        this.global.mae[0].toString() +
                        " < % MAE <  " +
                        this.global.mae[1].toString(),
                      style: ["mae2", "bold"]
                    },
                    {
                      text: "Correcto",
                      style: "mae2"
                    }
                  ],
                  [
                    {
                      text: "% MAE > 0.2",
                      style: ["mae3", "bold"]
                    },
                    {
                      text: "Mejorable",
                      style: "mae3"
                    }
                  ]
                ]
              }
            },

            {
              width: "*",
              text: ""
            }
          ]
        },

        "\n\n"
      ];
    };

    const clasificacion = (index: string) => {
      return [
        {
          text: `${index} - Cómo se clasifican las anomalías térmicas (según IEC 62446-3)`,
          style: "h3"
        },

        "\n",

        {
          text:
            "Según la norma internacional IEC 62446-3 para inspecciones termográficas de instalaciones fotovoltaicas, las anomalías térmicas se clasifican en tres clases o CoA (Class of Abnormalitys):",
          style: "p"
        },

        "\n\n",

        {
          ul: [
            {
              text: [
                {
                  text: "CoA 1 - sin anomalía",
                  style: ["coa1", "bold"]
                },
                ": hacemos seguimiento, pero no hay que actuar."
              ],
              style: "p"
            },
            {
              text: [
                {
                  text: "CoA 2 - anomalía térmica",
                  style: ["coa2", "bold"]
                },
                ": ver la causa y, si es necesario, arreglar en un periodo razonable."
              ],
              style: "p"
            },
            {
              text: [
                {
                  text: "CoA 3 - anomalía térmica relevante para la seguridad",
                  style: ["coa3", "bold"]
                },
                ": próxima interrupción de la operación normal del módulo, detectar la causa y rectificar en un periodo razonable."
              ],
              style: "p"
            }
          ]
        },

        "\n\n"
      ];
    };

    const localizar = (index: string) => {
      return [
        {
          text: `${index} - Cómo localizar las anomalías`,
          style: "h3"
        },

        "\n",

        {
          text:
            "Todas las incidencias tienen asociada una localización GPS, cuyo margen de error es de unos pocos metros (0-2 metros).",
          style: "p"
        },

        "\n",

        {
          text: this.getTextoLocalizar(),
          style: "p"
        },

        "\n\n"
      ];
    };

    const resultados = (index: string) => {
      return [
        {
          text: `${index} - Resultados de la inspección termográfica`,
          style: "h2",
          pageBreak: "before",
          alignment: "center"
        },

        {
          text: "",
          style: "p"
        },

        "\n"
      ];
    };

    const resultadosClase = (index: string) => {
      return [
        {
          text: `${index} - Resultados por clase de anomalía (CoA)`,
          style: "h3"
        },

        "\n",

        {
          text:
            "A continuación se detallan la cantidad de incidencias registradas según su clase (1, 2 ó 3).",
          style: "p"
        },

        {
          text: [
            `Se han registrado un total de `,
            { text: this.countClase[1] + this.countClase[2], style: "bold" },
            ` anomalías térmicas, de las cuales ${
              this.countClase[1]
            } son de clase 2 y ${this.countClase[2]} son de clase 3.`
          ],
          style: "p"
        },

        "\n"
      ];
    };

    const resultadosCategoria = (index: string) => {
      return [
        {
          text: `${index} - Resultados por categoría de la anomalía`,
          style: "h3"
        },

        "\n",

        {
          text: `La siguiente tabla muestra la cantidad de anomalías térmicas por categoría. En el caso de células calientes, sólo se incluyen aquellas con gradientes mayores a ${
            this.currentFiltroGradiente
          } ºC`,
          style: "p"
        },

        "\n",

        {
          columns: [
            {
              width: "*",
              text: ""
            },
            {
              width: "auto",
              table: {
                body: [
                  [
                    {
                      text: "Categoría",
                      style: "tableHeaderRed"
                    },

                    {
                      text: "Cantidad",
                      style: "tableHeaderRed"
                    },

                    {
                      text: "Porcentaje %",
                      style: "tableHeaderRed"
                    }
                  ]
                ]
                  .concat(this.getTablaCategoria())
                  .concat([
                    [
                      {
                        text: "TOTAL",
                        style: "bold"
                      },
                      {
                        text: this.filteredPcs.length.toString(),
                        style: "bold"
                      },
                      {
                        text: "100%",
                        style: "bold"
                      }
                    ]
                  ])
              }
            },

            {
              width: "*",
              text: ""
            }
          ]
        },

        "\n\n"
      ];
    };

    const resultadosPosicion = (index: string) => {
      let texto1;
      if (this.planta.tipo === "2 ejes") {
        texto1 =
          "Los números de la siguiente tabla indican la cantidad de anomalías térmicas registradas en la posición en la que se encuentran (fila y columna) dentro de cada seguidor. Sólo se incluyen anomalías térmicas de clase 2 y 3.";
      } else {
        texto1 =
          "Los números de la siguiente tabla indican la cantidad de anomalías térmicas registradas por altura. Sólo se incluyen anomalías térmicas de clase 2 y 3.";
      }
      return [
        {
          text: `${index} - Resultados por posición de la anomalía dentro del seguidor`,
          style: "h3"
        },

        "\n",

        {
          text:
            "Esta clasificación tiene como fin detectar posibles problemas relacionados con la posición de cada módulo. De este análisis se obtienen problemas relacionados con la vegetación de la instalación, deposiciones de pájaros, etc.",
          style: "p"
        },
        "\n",

        {
          text: texto1,
          style: "p"
        },

        "\n",

        {
          columns: [
            {
              width: "*",
              text: ""
            },

            {
              width: "auto",
              table: {
                body: this.getTablaPosicion()
              }
            },
            {
              width: "*",
              text: ""
            }
          ]
        },

        "\n"
      ];
    };

    const resultadosMAE = (index: string) => {
      return [
        {
          text: `${index} - MAE de la planta`,
          style: "h3"
        },

        "\n",

        {
          text:
            "El MAE (módulo apagados equivalentes) nos da medida cualitativa del impacto que tienen las incidencias registradas en el PR (performance ratio) de la planta.",
          style: "p"
        },

        "\n",

        {
          text: `MAE = ∆PR / PR = ${this.informe.mae} % (${this.calificacionMae(
            this.informe.mae
          )})`,
          style: "param"
        },

        "\n",

        {
          text: [
            `El MAE de ${this.planta.nombre} el ${this.datePipe.transform(
              this.informe.fecha * 1000,
              "dd/MM/yyyy"
            )} es `,
            {
              text: `${this.informe.mae} %`,
              style: "bold"
            },
            ` lo que nos indica un MAE `,
            {
              text: `${this.calificacionMae(this.informe.mae)}.`,
              style: "bold"
            }
          ],
          style: "p"
        }
      ];
    };

    let result = portada;

    let titulo = 1;
    let subtitulo = 1;
    let apartado: string;

    result = result.concat([
      {
        text: "1 - Introducción",
        style: "h2",
        alignment: "center"
      },

      "\n"
    ]);

    if (this.filtroApartados.includes("introduccion")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(introduccion(apartado));
    }

    if (this.filtroApartados.includes("criterios")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(criterios(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes("normalizacion")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(normalizacion(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes("datosVuelo")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(datosVuelo(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes("irradiancia")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(irradiancia(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes("paramsTermicos")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(paramsTermicos(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes("perdidaPR")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(perdidaPR(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes("clasificacion")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(clasificacion(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes("localizar")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(localizar(apartado));
      subtitulo = subtitulo + 1;
    }

    titulo = titulo + 1;
    subtitulo = 1;
    apartado = "2";

    result = result.concat(resultados(apartado));

    if (this.filtroApartados.includes("resultadosClase")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(resultadosClase(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes("resultadosCategoria")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(resultadosCategoria(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes("resultadosPosicion")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(resultadosPosicion(apartado));
      subtitulo = subtitulo + 1;
    }

    if (this.filtroApartados.includes("resultadosMAE")) {
      apartado = titulo
        .toString()
        .concat(".")
        .concat(subtitulo.toString());
      result = result.concat(resultadosMAE(apartado));
      subtitulo = subtitulo + 1;
    }

    return result;
  }

  getAnexoLista(numAnexo: string) {
    const allPagsAnexoLista = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n Anexo ${numAnexo}: Listado de anomalías térmicas`,
      style: "h1",
      alignment: "center",
      pageBreak: "before"
    };

    allPagsAnexoLista.push(pag1Anexo);

    allPagsAnexoLista.push({
      text: "",
      pageBreak: "after"
    });

    // Header
    const cabecera = [];
    if (this.planta.tipo === "2 ejes") {
      cabecera.push({
        text: "Seguidor",
        style: "tableHeaderRed"
      });
    }

    for (const c of this.currentFilteredColumnas) {
      cabecera.push({
        text: c.descripcion,
        style: "tableHeaderRed"
      });
    }

    // Body
    const body = [];
    for (const pc of this.filteredPcs) {
      const row = [];
      if (this.planta.tipo === "2 ejes") {
        // Columna 'globalX'

        row.push({
          text: pc["global_x"],
          style: "tableCellAnexo1"
        });
      }

      for (const c of this.currentFilteredColumnas) {
        if (c.nombre === "tipo") {
          row.push({
            text: this.pcDescripcion[pc[c.nombre]],
            style: "tableCellAnexo1"
          });
        } else if (c.nombre === "gradienteNormalizado") {
          row.push({
            text: Math.round(pc[c.nombre])
              .toString()
              .concat(" ºC"),
            style: "tableCellAnexo1"
          });
        } else if (c.nombre === "temperaturaMax") {
          row.push({
            text: Math.round(pc[c.nombre])
              .toString()
              .concat(" ºC"),
            style: "tableCellAnexo1"
          });
        } else {
          row.push({
            text: pc[c.nombre],
            style: "tableCellAnexo1"
          });
        }
      }
      body.push(row);
    }

    const tablaAnexo = [
      {
        columns: [
          {
            width: "*",
            text: ""
          },
          {
            width: "auto",
            table: {
              body: [cabecera].concat(body)
            }
          },
          {
            width: "*",
            text: ""
          }
        ]
      },

      {
        text: ""
      }
    ];

    return allPagsAnexoLista.concat(tablaAnexo);
  }

  getPaginaSeguidor(seguidor) {
    // Header
    const cabecera = [];
    for (const c of this.currentFilteredColumnas) {
      cabecera.push({
        text: c.descripcion,
        style: "tableHeaderRed"
      });
    }

    // Body
    const body = [];
    for (const pc of seguidor.pcs) {
      const row = [];

      for (const c of this.currentFilteredColumnas) {
        if (c.nombre === "tipo") {
          row.push({
            text: this.pcDescripcion[pc[c.nombre]],
            style: "tableCellAnexo1"
          });
        } else if (c.nombre === "gradienteNormalizado") {
          row.push({
            text: Math.round(pc[c.nombre])
              .toString()
              .concat(" ºC"),
            style: "tableCellAnexo1"
          });
        } else if (c.nombre === "temperaturaMax") {
          row.push({
            text: Math.round(pc[c.nombre])
              .toString()
              .concat(" ºC"),
            style: "tableCellAnexo1"
          });
        } else {
          row.push({
            text: pc[c.nombre],
            style: "tableCellAnexo1"
          });
        }
      }
      body.push(row);
    }
    return [cabecera, body];
  }

  getAnexoSeguidores(numAnexo: string) {
    const allPagsAnexo = [];
    // tslint:disable-next-line:max-line-length
    const pag1Anexo = {
      text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n Anexo ${numAnexo}: Anomalías térmicas por seguidor`,
      style: "h1",
      alignment: "center",
      pageBreak: "before"
    };

    allPagsAnexo.push(pag1Anexo);

    for (const s of this.filteredSeguidores) {
      const table = this.getPaginaSeguidor(s);

      const pagAnexo = [
        {
          text: "Seguidor " + s.pcs[0].global_x.toString(),
          style: "h2",
          alignment: "center",
          pageBreak: "before"
        },

        "\n",

        {
          image: `imgSeguidorCanvas${s.global_x}`,
          width: 450,
          alignment: "center"
        },

        "\n",

        {
          columns: [
            {
              width: "*",
              text: ""
            },

            {
              width: "auto",
              table: {
                body: [
                  [
                    {
                      text: "Hora",
                      style: "tableHeaderImageData"
                    },

                    {
                      text: "Irradiancia",
                      style: "tableHeaderImageData"
                    },

                    {
                      text: "Temp. ambiente",
                      style: "tableHeaderImageData"
                    },

                    {
                      text: "Viento",
                      style: "tableHeaderImageData"
                    },

                    {
                      text: "Emisividad",
                      style: "tableHeaderImageData"
                    },

                    {
                      text: "Temp. reflejada",
                      style: "tableHeaderImageData"
                    }
                  ],
                  [
                    {
                      text: this.datePipe.transform(
                        s.pcs[0].datetime * 1000,
                        "HH:mm:ss"
                      ),
                      style: "tableCellAnexo1"
                    },

                    {
                      text: Math.round(s.pcs[0].irradiancia)
                        .toString()
                        .concat(" W/m2"),
                      style: "tableCellAnexo1"
                    },
                    {
                      text: Math.round(s.pcs[0].temperaturaAire)
                        .toString()
                        .concat(" ºC"),
                      style: "tableCellAnexo1"
                    },

                    {
                      text: s.pcs[0].viento,
                      style: "tableCellAnexo1"
                    },

                    {
                      text: s.pcs[0].emisividad,
                      style: "tableCellAnexo1"
                    },

                    {
                      text: Math.round(s.pcs[0].temperaturaReflejada)
                        .toString()
                        .concat(" ºC"),
                      style: "tableCellAnexo1"
                    }
                  ]
                ]
              }
            },

            {
              width: "*",
              text: ""
            }
          ]
        },

        "\n",

        {
          columns: [
            {
              width: "*",
              text: ""
            },
            {
              width: "auto",
              table: {
                body: [table[0]].concat(table[1])
              }
            },
            {
              width: "*",
              text: ""
            }
          ]
        }
      ];

      allPagsAnexo.push(pagAnexo);
    }

    return allPagsAnexo;
  }

  getDocDefinition(imagesSeguidores) {
    const pages = this.getPagesPDF();
    let anexo1 = [];
    let anexo2 = [];
    let numAnexo = "I";

    if (this.filtroApartados.includes("anexo1")) {
      anexo1 = this.getAnexoLista(numAnexo);
      numAnexo = "II";
    }
    if (this.filtroApartados.includes("anexo2")) {
      anexo2 = this.getAnexoSeguidores(numAnexo);
    }

    return {
      header: (currentPage, pageCount) => {
        if (currentPage > 1) {
          return [
            {
              margin: 10,
              columns: [
                {
                  // usually you would use a dataUri instead of the name for client-side printing
                  // sampleImage.jpg however works inside playground so you can play with it
                  margin: [260, 0, 0, 0],
                  image: this.imgLogoBase64,
                  width: 40
                }
              ]
            }
          ];
        }
      },

      content: pages.concat(anexo1).concat(anexo2),

      images: imagesSeguidores,

      footer: (currentPage, pageCount) => {
        if (currentPage > 1) {
          return [
            {
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      text: currentPage,
                      alignment: "center",
                      color: "grey",
                      margin: [0, 10, 0, 0]
                    }
                  ]
                ]
              },
              layout: "noBorders"
            }
          ];
        }
      },

      styles: {
        h1: {
          fontSize: 22,
          bold: true
        },
        h2: {
          fontSize: 18,
          bold: true
        },
        h3: {
          fontSize: 15,
          bold: true
        },
        h4: {
          fontSize: 13,
          bold: true
        },
        h5: {
          fontSize: 13,
          bold: false,
          decoration: "underline",
          margin: [30, 0, 30, 0]
        },
        p: {
          alignment: "justify",
          margin: [30, 0, 30, 0]
        },
        tableHeaderRed: {
          alignment: "center",
          bold: true,
          fontSize: 10,
          fillColor: "#f46842",
          color: "white"
        },

        tableHeaderImageData: {
          alignment: "center",
          bold: true,
          fontSize: 10,
          fillColor: "#4cb6c9"
        },

        tableCellAnexo1: {
          alignment: "center",
          fontSize: 10
        },

        tableHeader: {
          alignment: "center",
          bold: true,
          fontSize: 13
        },

        pieFoto: {
          alignment: "center",
          fontSize: 11,
          italics: true,
          color: "gray"
        },
        subtitulo: {
          alignment: "right",
          fontSize: 15
        },

        table: {
          alignment: "center"
        },

        param: {
          alignment: "center",
          bold: true,
          decoration: "underline"
        },
        tableCell: {
          alignment: "center"
        },
        mae1: {
          fillColor: "#559c55",
          alignment: "center"
        },
        bold: {
          bold: true
        },
        mae2: {
          fillColor: "#00a0ea",
          alignment: "center"
        },
        mae3: {
          fillColor: "#fdc400",
          alignment: "center"
        },
        coa1: {
          color: "black"
        },
        coa2: {
          color: "orange"
        },
        coa3: {
          color: "red"
        },
        tableLeft: {
          bold: true,
          alignment: "right"
        }
      }
    };
  }

  getAltura(local_y: number) {
    // Por defecto, la altura alta es la numero 1
    if (this.planta.alturaBajaPrimero) {
      return this.planta.filas - (local_y - 1);
    } else {
      return local_y;
    }
  }
}
