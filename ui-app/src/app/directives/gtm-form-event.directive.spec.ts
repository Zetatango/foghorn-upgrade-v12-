import { TestBed, ComponentFixture, waitForAsync } from '@angular/core/testing';
import { GtmFormEventDirective } from './gtm-form-event.directive';
import { Component, DebugElement } from '@angular/core';
import { LoggingService } from '../services/logging.service';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CookieService } from 'ngx-cookie-service';
import { UtilityService } from '../services/utility.service';
import { By } from '@angular/platform-browser';
import Bugsnag from '@bugsnag/js';

@Component({
  template: `
      <form id="name" name="form1">
        <input formcontrolname="input1">
      </form>
  `
})
export class FormComponent {}

@Component({
  template: `
      <form id="name" name="form1">
        <input formcontrolname="input1">
        <input formcontrolname="input2">
        <input formcontrolname="input3">
        <input formcontrolname="input4">
      </form>
  `
})
export class MultiInputFormComponent {}

@Component({
  template: '<form id="no-name"></form>'
})
export class NoNameFormComponent {}

describe('GtmFormEventDirective', () => {
  let fixture1: ComponentFixture<FormComponent>;
  let fixture2: ComponentFixture<NoNameFormComponent>;
  let fixture3: ComponentFixture<MultiInputFormComponent>;

  let formEl: DebugElement;
  let noNameFormEl: DebugElement;
  let multiInputFormEl: DebugElement;
  let loggingService: LoggingService;
  let directive: GtmFormEventDirective;

  beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
          imports: [ HttpClientTestingModule ],
          declarations:[
            NoNameFormComponent,
            FormComponent,
            MultiInputFormComponent
          ],
          providers: [
            LoggingService,
            UtilityService,
            CookieService
          ],
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture1 = TestBed.createComponent(FormComponent);
    formEl = fixture1.debugElement.query(By.css('form'));

    fixture2 = TestBed.createComponent(NoNameFormComponent);
    noNameFormEl = fixture2.debugElement.query(By.css('form'));

    fixture3 = TestBed.createComponent(MultiInputFormComponent);
    multiInputFormEl = fixture3.debugElement.query(By.css('form'));

    loggingService = TestBed.inject(LoggingService);

    spyOn(Bugsnag, 'notify');
    spyOn(loggingService, 'GTMOnBlur');
  });

  it('should create an instance', () => {
    directive = new GtmFormEventDirective(formEl, loggingService);
    expect(directive).toBeTruthy();
  });

  it('should call GTMOnBlur with correct name when clicked: single input', () => {
    directive = new GtmFormEventDirective(formEl, loggingService);
    directive.ngAfterViewInit();
    const input = fixture1.debugElement.query(By.css('input')).nativeElement;
    input.dispatchEvent(new Event('blur'));

    expect(loggingService.GTMOnBlur).toHaveBeenCalledOnceWith('form1', 'input1');
  });

  it('should call GTMOnBlur with correct name when clicked: multiple inputs', () => {
    directive = new GtmFormEventDirective(multiInputFormEl, loggingService);
    directive.ngAfterViewInit();
    const inputs = fixture3.debugElement.queryAll(By.css('input'));

    inputs.forEach((i) =>{
      const input = i.nativeElement;
      const name = input.getAttribute('formcontrolname');

      input.dispatchEvent(new Event('blur'));
      expect(loggingService.GTMOnBlur).toHaveBeenCalledWith('form1', name);
    });

    expect(loggingService.GTMOnBlur).toHaveBeenCalledTimes(inputs.length);
  });

  it('should call GTMOnBlur with correct name when clicked: no inputs', () => {
    directive = new GtmFormEventDirective(noNameFormEl, loggingService);
    directive.ngAfterViewInit();

    expect(loggingService.GTMOnBlur).toHaveBeenCalledTimes(0);
    expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
  });
});
