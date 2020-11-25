import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeMapComponent } from './informe-map.component';

describe('InformeMapComponent', () => {
    let component: InformeMapComponent;
    let fixture: ComponentFixture<InformeMapComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [InformeMapComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InformeMapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});