import { Component, OnInit } from '@angular/core';

import { SeguidoresControlService } from '../../services/seguidores-control.service';

@Component({
  selector: 'app-seguidor-next-prev',
  templateUrl: './seguidor-next-prev.component.html',
  styleUrls: ['./seguidor-next-prev.component.css'],
})
export class SeguidorNextPrevComponent implements OnInit {
  constructor(private seguidoresControlService: SeguidoresControlService) {}

  ngOnInit(): void {}

  nextSeguidor() {
    this.seguidoresControlService.selectNextSeguidor();
  }

  prevSeguidor() {
    this.seguidoresControlService.selectPrevSeguidor();
  }
}
