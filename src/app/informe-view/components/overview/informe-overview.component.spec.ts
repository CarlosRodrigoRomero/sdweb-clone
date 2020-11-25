import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeOverviewComponent } from './informe-overview.component';

describe('InformeOverviewComponent', () => {
    let component: InformeOverviewComponent;
    let fixture: ComponentFixture<InformeOverviewComponent>;

    beforeEach(async(() => {
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