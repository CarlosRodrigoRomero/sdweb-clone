import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PcDetailsDialogComponent } from './pc-details-dialog.component';

xdescribe('PcDetailsDialogComponent', () => {
    let component: PcDetailsDialogComponent;
    let fixture: ComponentFixture<PcDetailsDialogComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [PcDetailsDialogComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PcDetailsDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});