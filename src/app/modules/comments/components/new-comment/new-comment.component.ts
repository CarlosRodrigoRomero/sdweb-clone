import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { ComentariosService } from '@data/services/comentarios.service';

import { Comentario } from '@core/models/comentario';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-new-comment',
  templateUrl: './new-comment.component.html',
  styleUrls: ['./new-comment.component.css'],
})
export class NewCommentComponent implements OnInit, OnDestroy {
  form: FormGroup;
  comentario: Comentario;
  tipoComentarioSelected: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private comentariosControlService: ComentariosControlService,
    private comentariosService: ComentariosService
  ) {}

  ngOnInit(): void {
    this.buildForm();

    this.subscriptions.add(
      this.comentariosControlService.tipoComentarioSelected$.subscribe((tipo) => (this.tipoComentarioSelected = tipo))
    );
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      texto: [, [Validators.required]],
    });
  }

  sendMessage(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      this.comentario = {
        tipo: this.tipoComentarioSelected,
        texto: this.form.get('texto').value,
        datetime: Date.now(),
        anomaliaId: this.comentariosControlService.anomaliaSelected.id,
        informeId: this.comentariosControlService.anomaliaSelected.informeId,
      };

      this.comentariosService.addComentario(this.comentario);

      this.form.reset();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
