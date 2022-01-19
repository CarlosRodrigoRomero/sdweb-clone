import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InformeAddComponent } from './informe-add.component';

xdescribe('InformeAddComponent', () => {
    let component: InformeAddComponent;
    let fixture: ComponentFixture<InformeAddComponent>;

    beforeEach(waitForAsync(() => {
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