import { Component, OnInit } from '@angular/core';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
@Component({
  selector: 'app-estado',
  templateUrl: './estado.component.html',
  styleUrls: ['./estado.component.css'],
})
export class EstadoComponent implements OnInit {
  constructor(public portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {}
}
