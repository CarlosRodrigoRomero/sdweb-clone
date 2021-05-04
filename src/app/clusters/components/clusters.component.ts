import { Component, OnInit } from '@angular/core';
import { ClustersService } from '@core/services/clusters.service';

@Component({
  selector: 'app-clusters',
  templateUrl: './clusters.component.html',
  styleUrls: ['./clusters.component.css'],
})
export class ClustersComponent implements OnInit {
  public trayectoriaLoaded = false;
  public nombrePlanta: string;

  constructor(private clustersService: ClustersService) {}

  ngOnInit(): void {
    this.clustersService.initService().subscribe((v) => (this.trayectoriaLoaded = v));
    this.clustersService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre));
  }
}
