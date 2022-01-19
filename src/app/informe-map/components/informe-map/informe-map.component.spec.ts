import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InformeMapComponent } from './informe-map.component';

xdescribe('InformeMapComponent', () => {
    let component: InformeMapComponent;
    let fixture: ComponentFixture<InformeMapComponent>;

    beforeEach(waitForAsync(() => {
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