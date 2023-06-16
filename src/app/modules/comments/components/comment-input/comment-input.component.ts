import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ComentariosService } from '@data/services/comentarios.service';

import { Anomalia } from '@core/models/anomalia';
import { Comentario } from '@core/models/comentario';

@Component({
  selector: 'app-comment-input',
  templateUrl: './comment-input.component.html',
  styleUrls: ['./comment-input.component.css'],
})
export class CommentInputComponent implements OnChanges {
  @Input() anomaliaSelected: Anomalia;
  @Input() type: string;
  @Input() label: string;

  editInput = false;
  form: FormGroup;
  comentario: string;

  constructor(private formBuilder: FormBuilder, private comentariosService: ComentariosService) {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('anomaliaSelected')) {
      // volvemos el input no editable al cambiar de anomalía
      this.editInput = false;

      if (this.anomaliaSelected !== undefined) {
        if (
          this.anomaliaSelected.hasOwnProperty('comentarios') &&
          this.anomaliaSelected.comentarios.length > 0 &&
          this.anomaliaSelected.comentarios.filter((com) => com.tipo === this.type).length > 0
        ) {
          this.comentario = this.anomaliaSelected.comentarios.find((com) => com.tipo === this.type).texto;
          this.form.patchValue({ comment: this.comentario });
        } else {
          this.comentario = null;
          this.form.patchValue({ comment: null });
        }
      }
    }
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      comment: [],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      const comentario: Comentario = {
        tipo: this.type,
        texto: this.form.get('comment').value,
        datetime: Date.now(),
        anomaliaId: this.anomaliaSelected.id,
        informeId: this.anomaliaSelected.informeId,
      };

      if (this.anomaliaSelected.hasOwnProperty('comentarios') && this.anomaliaSelected.comentarios.length > 0) {
        // averiguamos el indice del comentario que estamos editando
        const index = this.anomaliaSelected.comentarios.findIndex((com) => com.tipo === this.type);

        if (index >= 0) {
          comentario.id = this.anomaliaSelected.comentarios[index].id;
          // si existe y no recibimos ningún valor lo eliminamos
          if (this.form.get('comment').value === '') {
            this.comentariosService.deleteComentario(comentario.id);
          } else {
            // si existe y recibimos un valor, lo actualizamos
            this.comentariosService.updateComentario(comentario);
          }
        } else {
          // si no existe, lo creamos
          this.comentariosService.addComentario(comentario);
        }
      } else {
        this.comentariosService.addComentario(comentario);
      }

      this.comentario = this.form.get('comment').value;
    }
    // volvemos el input a no editable
    this.editInput = false;
  }
}
