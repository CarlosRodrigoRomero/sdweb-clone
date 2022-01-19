import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InformeEditComponent } from './informe-edit.component';

xdescribe('InformeEditComponent', () => {
    let component: InformeEditComponent;
    let fixture: ComponentFixture<InformeEditComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [InformeEditComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InformeEditComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});