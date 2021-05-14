import { Component, OnInit } from '@angular/core';
import { Seguidor } from '@core/models/seguidor';

import { SeguidoresControlService } from '../../services/seguidores-control.service';

@Component({
  selector: 'app-seguidor-view',
  templateUrl: './seguidor-view.component.html',
  styleUrls: ['./seguidor-view.component.css'],
})
export class SeguidorViewComponent implements OnInit {
  public seguidorSelected: Seguidor = undefined;

  constructor(private seguidoresControlService: SeguidoresControlService) {}

  ngOnInit(): void {
    this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => {
      this.seguidorSelected = seguidor;

      this.seguidoresControlService.getImageSeguidor('jpg');
    });
  }
}
