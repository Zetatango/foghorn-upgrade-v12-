import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AgreementType } from 'app/models/agreement';


import { PadAgreementComponent } from './pad-agreement.component';

describe('PadAgreementComponent', () => {
  let component: PadAgreementComponent;
  let fixture: ComponentFixture<PadAgreementComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PadAgreementComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PadAgreementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('agreementType', () => {
    it('should return AgreementType.pre_authorized_debit', () => {
      expect(component.agreementType).toEqual(AgreementType.pre_authorized_debit);
    });
  });

  describe('next()', () => {
    it('should emit a next event', () => {
      spyOn(component.nextEvent, 'emit');

      component.next();
      expect(component.nextEvent.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('back()', () => {
    it('should emit a back event', () => {
      spyOn(component.backEvent, 'emit');

      component.back();
      expect(component.backEvent.emit).toHaveBeenCalledTimes(1);
    });
  });
});
