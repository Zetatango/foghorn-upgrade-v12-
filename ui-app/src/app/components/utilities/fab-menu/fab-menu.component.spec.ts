import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FabMenuComponent } from './fab-menu.component';

import { TranslateModule } from '@ngx-translate/core';
import { FabMenuItem } from 'app/models/fab-menu';

describe('FabMenuComponent', () => {
  let component: FabMenuComponent;
  let fixture: ComponentFixture<FabMenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot()
      ],
      declarations: [FabMenuComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FabMenuComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize menu with all needed properties', () => {
    component.ngOnInit();
    component.menu.forEach((menuItem: FabMenuItem) => {
      expect(menuItem.titleKey).toBeDefined();
      expect(menuItem.icon).toBeDefined();
      expect(menuItem.onClick).toBeDefined();
      expect(menuItem.isVisible).toBeDefined();
    });
  });

  it('should handle clicks and emit events', () => {
    spyOn(component.openQuickBooksOpenEvent, 'emit');
    spyOn(component.openInviteEvent, 'emit');
    spyOn(component.closeEvent, 'emit');

    component.ngOnInit();
    component.menu.forEach((menuItem: FabMenuItem) => {
      menuItem.onClick();
    });

    expect(component.openQuickBooksOpenEvent.emit).toHaveBeenCalledTimes(1);
    expect(component.openInviteEvent.emit).toHaveBeenCalledTimes(1);
    expect(component.closeEvent.emit).toHaveBeenCalledTimes(1);
  });

  it('should provide a value for isVisible', () => {
    component.ngOnInit();
    component.menu.forEach((menuItem: FabMenuItem) => {
      expect(menuItem.isVisible()).not.toBeNull();
    });
  });
});
