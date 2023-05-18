import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-select-initial-view',
  templateUrl: './select-initial-view.component.html',
  styleUrls: ['./select-initial-view.component.css'],
})
export class SelectInitialViewComponent implements OnInit {
  viewSelected = 'map';
  views = ['analysis', 'map'];
  viewsLabels: any = {
    map: 'Mapa',
    analysis: 'Análisis',
  };

  constructor() {}

  ngOnInit(): void {
    this.viewSelected = localStorage.getItem('initialViewReports') || 'map';
  }

  changeView(view: string) {
    this.viewSelected = view;

    // Almacenamos la vista seleccionada en la memoria local
    localStorage.setItem('initialViewReports', view);
  }
}
