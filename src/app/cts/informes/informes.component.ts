import { Component, OnInit } from '@angular/core';
import { InformeInterface } from '../../models/informe';
import { InformeService } from '../../services/informe.service';

@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css']
})
export class InformesComponent implements OnInit {
  public informes: InformeInterface[];

  constructor(private informeService: InformeService) { }

  ngOnInit() {
    this.informeService.getInformes().subscribe( informes => {
      this.informes = informes;
    });
  }

}
