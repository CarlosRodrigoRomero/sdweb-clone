import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InformeViewComponent } from './informe-view.component';

xdescribe('InformeViewComponent', () => {
    let component: InformeViewComponent;
    let fixture: ComponentFixture<InformeViewComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [InformeViewComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InformeViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});