import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AvisoLegalComponent } from './aviso-legal.component';

xdescribe('AvisoLegalComponent', () => {
    let component: AvisoLegalComponent;
    let fixture: ComponentFixture<AvisoLegalComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [AvisoLegalComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AvisoLegalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});