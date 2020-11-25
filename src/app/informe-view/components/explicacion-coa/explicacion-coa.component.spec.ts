import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplicacionCoaComponent } from './explicacion-coa.component';

describe('ExplicacionCoaComponent', () => {
    let component: ExplicacionCoaComponent;
    let fixture: ComponentFixture<ExplicacionCoaComponent>;

    beforeEach(async(() => {
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