import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InformeOverviewComponent } from './informe-overview.component';

xdescribe('InformeOverviewComponent', () => {
    let component: InformeOverviewComponent;
    let fixture: ComponentFixture<InformeOverviewComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [InformeOverviewComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InformeOverviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});