import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-map-shared',
  templateUrl: './map-shared.component.html',
  styleUrls: ['./map-shared.component.css'],
})
export class MapSharedComponent implements OnInit {
  form: FormGroup;

  constructor() {}

  ngOnInit(): void {}

  send(event: Event) {}

  stopPropagation(event) {
    event.stopPropagation();
  }
}
