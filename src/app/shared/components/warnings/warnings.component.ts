import { Component, Input, OnInit } from '@angular/core';

import { WarningService } from '@core/services/warning.service';

import { Warning } from '../warnings-menu/warnings';

@Component({
  selector: 'app-warnings',
  templateUrl: './warnings.component.html',
  styleUrls: ['./warnings.component.css'],
})
export class WarningsComponent implements OnInit {
  warnings: Warning[] = [];

  @Input() informeId: string;

  constructor(private warningService: WarningService) {}

  ngOnInit(): void {
    this.warningService.getWarnings(this.informeId).subscribe((warnings) => {
      this.warnings = warnings;
      console.log(warnings);
    });
  }
}
