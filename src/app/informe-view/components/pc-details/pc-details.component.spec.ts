import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PcDetailsComponent } from './pc-details.component';

xdescribe('PcDetailsComponent', () => {
    let component: PcDetailsComponent;
    let fixture: ComponentFixture<PcDetailsComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [PcDetailsComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PcDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});