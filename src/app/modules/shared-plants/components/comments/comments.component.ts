import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ComentariosService } from '@data/services/comentarios.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';

import { Anomalia } from '@core/models/anomalia';
import { Comentario } from '@core/models/comentario';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
})
export class CommentsComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() anomalia: Anomalia;
  tipoComentario = 'anomalia';
  comentariosAnom: Comentario[];
  comentariosIV: Comentario[];

  form: FormGroup;
  comentario: Comentario;

  constructor(
    private formBuilder: FormBuilder,
    private comentariosService: ComentariosService,
    private comentariosControlService: ComentariosControlService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngAfterViewInit(): void {
    const element = document.getElementById('comentarios-list');
    if (element) {
      element.style.height = window.innerHeight - 800 + 'px';
    }
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      texto: [, [Validators.required]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.anomalia.hasOwnProperty('comentarios')) {
      this.comentariosAnom = this.anomalia.comentarios
        .filter((com) => com.tipo === 'anomalia')
        .sort((a, b) => b.datetime - a.datetime);
      this.comentariosIV = this.anomalia.comentarios
        .filter((com) => com.tipo === 'iv')
        .sort((a, b) => b.datetime - a.datetime);
    }
  }

  sendMessage(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      this.comentario = {
        tipo: this.tipoComentario,
        texto: this.form.get('texto').value,
        datetime: Date.now(),
        anomaliaId: this.anomalia.id,
        informeId: this.anomalia.informeId,
      };

      this.comentariosService.addComentario(this.comentario);

      if (this.tipoComentario === 'anomalia') {
        this.comentariosAnom.push(this.comentario);
        this.comentariosAnom = this.comentariosAnom.sort((a, b) => b.datetime - a.datetime);
      } else if (this.tipoComentario === 'iv') {
        this.comentariosIV.push(this.comentario);
        this.comentariosIV = this.comentariosIV.sort((a, b) => b.datetime - a.datetime);
      }

      this.form.reset();
    }
  }

  setTipoComentario(event: any) {
    const index = event.index;

    this.tipoComentario = this.comentariosControlService.tiposComentarios[index];
  }
}
