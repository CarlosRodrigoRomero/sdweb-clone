import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientesComponent } from './clientes.component';

xdescribe('ClientesComponent', () => {
    let component: ClientesComponent;
    let fixture: ComponentFixture<ClientesComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ClientesComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ClientesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});