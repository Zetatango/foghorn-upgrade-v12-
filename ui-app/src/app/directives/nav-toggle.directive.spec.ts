import { NavToggleDirective } from './nav-toggle.directive';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';

import { By } from '@angular/platform-browser';
import { NavToggleService } from 'app/services/nav-toggle.service';

// Component Stub
@Component({
  template: `
    <a class="nav-item nav-link">Nav Link</a>
    <div class="dropdown nav-item">
      <a class="nav-link dropdown-toggle" role="button">Dropdown Toggle</a>

      <div class="dropdown-menu">
        <a class="dropdown-item" role="button">Drowndown Link</a>
      </div><!--.dropdown-menu-->
    </div><!--.dropdown-->
  `
})
class TestNavComponent {}

describe('NavToggleDirective', () => {
  let fixture: ComponentFixture<TestNavComponent>;

  let navLink: DebugElement;
  let dropdownItem: DebugElement;
  let dropdownToggle: DebugElement;
  let clickEvent: Event;

  let navToggleService: NavToggleService;
  let navToggleDirective: NavToggleDirective;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NavToggleDirective, TestNavComponent ],
      providers: [ NavToggleService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestNavComponent);
    navToggleService = TestBed.inject(NavToggleService);
    navToggleDirective = new NavToggleDirective(navToggleService);

    navLink = fixture.debugElement.query(By.css('.nav-link:not(.dropdown-toggle)'));
    dropdownItem = fixture.debugElement.query(By.css('.dropdown-item'));
    dropdownToggle = fixture.debugElement.query(By.css('.dropdown-toggle'));
    clickEvent = new Event('click', { bubbles: true });

    navToggleService.isCollapsed = false;
  });

  it('should create an instance', () => {
    expect(navToggleDirective).toBeTruthy();
  });

  describe('on selector .nav-link:not(.dropdown-toggle) clicked', () => {
    it('should set the state of the nav to collapsed', () => {
      navLink.nativeElement.dispatchEvent(clickEvent);

      expect(navToggleService.isCollapsed).toBeTrue();
    });
  });

  describe('on selector .dropdown-item clicked', () => {
    it('should set the state of the nav to collapsed', () => {
      dropdownItem.nativeElement.dispatchEvent(clickEvent);

      expect(navToggleService.isCollapsed).toBeTrue();
    });
  });

  describe('on selector .dropdown-toggle clicked', () => {
    it('should set the state of the nav to collapsed', () => {
      dropdownToggle.nativeElement.dispatchEvent(clickEvent);

      expect(navToggleService.isCollapsed).toBeFalse();
    });
  });
});
