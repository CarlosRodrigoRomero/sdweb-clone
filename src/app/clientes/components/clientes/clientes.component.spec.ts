import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClientesComponent } from './clientes.component';

xdescribe('ClientesComponent', () => {
    let component: ClientesComponent;
    let fixture: ComponentFixture<ClientesComponent>;

    beforeEach(waitForAsync(() => {
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