import { Component, OnInit } from '@angular/core';
import { InformeInterface } from '../../models/informe';
import { InformeService } from '../../services/informe.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css']
})
export class InformesComponent implements OnInit {
  public informes: InformeInterface[];

  constructor(
    private auth: AuthService,
    private informeService: InformeService
    ) { }

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      this.informeService.getInformesDeEmpresa(user.uid).subscribe( informes => {
        this.informes = informes;
      });
    });


  }

}
