import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PcDetailsDialogComponent } from './pc-details-dialog.component';

describe('PcDetailsDialogComponent', () => {
    let component: PcDetailsDialogComponent;
    let fixture: ComponentFixture<PcDetailsDialogComponent>;

    beforeEach(async(() => {
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