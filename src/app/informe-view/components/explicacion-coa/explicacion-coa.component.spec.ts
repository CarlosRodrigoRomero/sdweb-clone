import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExplicacionCoaComponent } from './explicacion-coa.component';

xdescribe('ExplicacionCoaComponent', () => {
    let component: ExplicacionCoaComponent;
    let fixture: ComponentFixture<ExplicacionCoaComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ExplicacionCoaComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ExplicacionCoaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});