import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AgreementType } from 'app/models/agreement';


import { PafAgreementComponent } from './paf-agreement.component';

describe('PafAgreementComponent', () => {
  let component: PafAgreementComponent;
  let fixture: ComponentFixture<PafAgreementComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PafAgreementComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PafAgreementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('agreementType', () => {
    it('should return AgreementType.pre_authorized_financing', () => {
      expect(component.agreementType).toEqual(AgreementType.pre_authorized_financing);
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
