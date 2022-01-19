import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PcFilterComponent } from './pc-filter.component';

xdescribe('PcFilterComponent', () => {
    let component: PcFilterComponent;
    let fixture: ComponentFixture<PcFilterComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [PcFilterComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PcFilterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});