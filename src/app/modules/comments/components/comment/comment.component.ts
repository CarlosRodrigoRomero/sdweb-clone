import { Component, Input, OnInit } from '@angular/core';

import { Comentario } from '@core/models/comentario';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css'],
})
export class CommentComponent implements OnInit {
  @Input() comentario: Comentario;

  constructor() {}

  ngOnInit(): void {}
}
