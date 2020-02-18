import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { PcListComponent } from "./pc-list.component";

const routes: Routes = [
  {
    path: "",
    component: PcListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ListRoutingModule {}
