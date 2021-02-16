import { Component, OnInit } from '@angular/core';

import { InformeService } from '@core/services/informe.service';

@Component({
  selector: 'app-shared-report',
  templateUrl: './shared-report.component.html',
  styleUrls: ['./shared-report.component.css'],
})
export class SharedReportComponent implements OnInit {
  informeID = 'vfMHFBPvNFnOFgfCgM9L';

  constructor(private informeService: InformeService) {}

  ngOnInit(): void {
    this.informeService.getInforme(this.informeID).subscribe((informe) => console.log(informe));
  }
}
