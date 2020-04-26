import { NgModule } from '@angular/core';

import { ClientesRoutingModule } from './clientes-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ValidateEstructuraPipe } from '../pipes/validate-estructura.pipe';
import { AuthService } from '../services/auth.service';
import { InformesComponent } from './informes/informes.component';
import { ClientesComponent } from './clientes.component';
import { NavbarComponent } from './navbar/navbar.component';
import { PlantaEditComponent } from './planta-edit/planta-edit.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [InformesComponent, ClientesComponent, NavbarComponent, PlantaEditComponent],
  imports: [ClientesRoutingModule, SharedModule, FormsModule, ReactiveFormsModule],
  providers: [ValidateEstructuraPipe, AuthService],
})
export class ClientesModule {}
