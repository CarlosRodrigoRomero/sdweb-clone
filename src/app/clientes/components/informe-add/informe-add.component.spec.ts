import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeAddComponent } from './informe-add.component';

describe('InformeAddComponent', () => {
    let component: InformeAddComponent;
    let fixture: ComponentFixture<InformeAddComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [InformeAddComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InformeAddComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});