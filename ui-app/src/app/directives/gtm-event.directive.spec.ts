import { TestBed, ComponentFixture, waitForAsync } from '@angular/core/testing';
import { GtmEventDirective } from './gtm-event.directive';
import { Component, DebugElement } from '@angular/core';
import { LoggingService, GTMEvent } from '../services/logging.service';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CookieService } from 'ngx-cookie-service';
import { UtilityService } from '../services/utility.service';
import { By } from '@angular/platform-browser';
import Bugsnag from '@bugsnag/js';

@Component({
  template: '<button id="name" name="share">Fab Button</button>'
})
export class NameComponent {}

@Component({
  template: '<button id="no-name">Fab Button</button>'
})
export class NoNameComponent {}

describe('GtmEventDirective', () => {
  let fixture1: ComponentFixture<NameComponent>;
  let fixture2: ComponentFixture<NoNameComponent>;

  let buttonEl: DebugElement;
  let noNameEl: DebugElement;
  let loggingService: LoggingService;
  let directive: GtmEventDirective;

  beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
          imports: [ HttpClientTestingModule ],
          declarations: [ NameComponent, NoNameComponent ],
          providers: [
            LoggingService,
            UtilityService,
            CookieService
          ],
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture1 = TestBed.createComponent(NameComponent);
    buttonEl = fixture1.debugElement.query(By.css('button'));

    fixture2 = TestBed.createComponent(NoNameComponent);
    noNameEl = fixture2.debugElement.query(By.css('button'));

    loggingService = TestBed.inject(LoggingService);

    spyOn(Bugsnag, 'notify');
    spyOn(loggingService, 'GTMUpdate');
  });

  it('should create an instance', () => {
    directive = new GtmEventDirective(buttonEl, loggingService);
    expect(directive).toBeTruthy();
  });

  it('should call GTMUpdate with correct name when clicked: with name attr', () => {
    directive = new GtmEventDirective(buttonEl, loggingService);
    directive.ngAfterViewInit();
    const button = buttonEl.nativeElement;
    button.dispatchEvent(new Event('click'));

    expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, button.name);
  });

  it('should call GTMUpdate with correct name when clicked: no name attr', () => {
    directive = new GtmEventDirective(noNameEl, loggingService);
    directive.ngAfterViewInit();
    const button = noNameEl.nativeElement;
    button.dispatchEvent(new Event('click'));

    expect(loggingService.GTMUpdate).toHaveBeenCalledTimes(0);
    expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
  });
});
