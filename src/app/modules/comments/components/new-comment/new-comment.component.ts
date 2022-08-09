import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { ComentariosService } from '@data/services/comentarios.service';

import { Comentario } from '@core/models/comentario';

@Component({
  selector: 'app-new-comment',
  templateUrl: './new-comment.component.html',
  styleUrls: ['./new-comment.component.css'],
})
export class NewCommentComponent implements OnInit {
  form: FormGroup;
  comentario: Comentario;

  constructor(
    private formBuilder: FormBuilder,
    private comentariosControlService: ComentariosControlService,
    private comentariosService: ComentariosService
  ) {}

  ngOnInit(): void {
    this.buildForm();
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
        texto: this.form.get('texto').value,
        datetime: Date.now(),
        anomaliaId: this.comentariosControlService.anomaliaSelected.id,
        informeId: this.comentariosControlService.anomaliaSelected.informeId,
      };

      this.comentariosService.addComentario(this.comentario);

      this.form.reset();
    }
  }
}
