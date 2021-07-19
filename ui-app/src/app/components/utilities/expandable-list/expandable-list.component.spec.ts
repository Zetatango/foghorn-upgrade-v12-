import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ExpandableListItem, ExpandableListStatus } from 'app/models/expandable-list';
import { listItem, expandableListItemFactory } from 'app/test-stubs/factories/expandable-list';
import { invoiceResponseFactory } from 'app/test-stubs/factories/invoice';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ExpandableListComponent } from './expandable-list.component';

describe('ExpandableListComponent', () => {
  let component: ExpandableListComponent;
  let fixture: ComponentFixture<ExpandableListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HttpClientTestingModule, InfiniteScrollModule, FormsModule],
      declarations: [ExpandableListComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpandableListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set component\'s status to VIEW', () => {
      expect(component.status).toBe(ExpandableListStatus.VIEW);
    });
  });

  describe('onScroll', () => {
    it('should emit nextEvent', () => {
      spyOn(component.nextEvent, 'emit');
      component.onScroll();
      expect(component.nextEvent.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('toggle', () => {
    it('should handle toggling list item to be open/close', () => {
      const li: ExpandableListItem = listItem;
      component.data = [li];
      expect(li.isOpen).toBeFalsy();
      component.toggle(li);
      expect(li.isOpen).toBeTruthy();
      component.toggle(li);
      expect(li.isOpen).toBeFalsy();
    });
  });

  describe('data & listItems', () => {
    it('should set listItems when data is set', () => {
      const numberOfItems = 5;
      component.data = invoiceResponseFactory.buildList(numberOfItems);
      fixture.detectChanges();

      expect(component.listItems.length).toBe(numberOfItems);
      component.listItems.forEach(li => {
        expect(li.isOpen).toBeDefined();
        expect(li.isSelected).toBeDefined();
        expect(li.data).toBeDefined();
      });
    });

    it('should handle adding listItems when data is set with mixed data(ExpandableListItem, Invoice)', () => {
      const numberOfItems = 5;

      let data = invoiceResponseFactory.buildList(numberOfItems);
      component.data = data;
      fixture.detectChanges();

      data = data.concat(invoiceResponseFactory.buildList(2));
      component.data = data;
      fixture.detectChanges();

      expect(component.listItems.length).toBe(data.length);
      component.listItems.forEach(li => {
        expect(li.isOpen).toBeDefined();
        expect(li.isSelected).toBeDefined();
        expect(li.data).toBeDefined();
      });
    });
  });

  describe('areAllSelected', () => {
    it('should return true if all values have isSelected: true', () => {
      const allSelectedList = expandableListItemFactory.buildList(3, { isSelected: true });
      spyOnProperty(component, 'listItems').and.returnValue(allSelectedList);
      expect(component.areAllSelected).toBeTrue();
    });

    it('should return false if NOT all values have isSelected: true', () => {
      const noneSelectedList = expandableListItemFactory.buildList(3, { isSelected: false });
      spyOnProperty(component, 'listItems').and.returnValue(noneSelectedList);
      expect(component.areAllSelected).toBeFalse();
    });

    it('should return false if NOT all values have isSelected: true', () => {
      const oneSelectedList = expandableListItemFactory.buildList(3, { isSelected: false });
      oneSelectedList[0].isSelected = true;
      spyOnProperty(component, 'listItems').and.returnValue(oneSelectedList);
      expect(component.areAllSelected).toBeFalse();
    });

    it('should return false if listItems is empty', () => {
      spyOnProperty(component, 'listItems').and.returnValue([]);
      expect(component.areAllSelected).toBeFalse();
    });
  });

  describe('areAnySelected', () => {
    it('should return true if any values have isSelected: true', () => {
      const oneSelectedList = expandableListItemFactory.buildList(3, { isSelected: false });
      oneSelectedList[0].isSelected = true;
      spyOnProperty(component, 'listItems').and.returnValue(oneSelectedList);
      expect(component.areAnySelected).toBeTrue();
    });

    it('should return false if NO values have isSelected: true', () => {
      const noneSelectedList = expandableListItemFactory.buildList(3, { isSelected: false });
      spyOnProperty(component, 'listItems').and.returnValue(noneSelectedList);
      expect(component.areAnySelected).toBeFalse();
    });

    it('should return true if any values have isSelected: true', () => {
      const oneSelectedList = expandableListItemFactory.buildList(3, { isSelected: false });
      oneSelectedList[0].isSelected = true;
      spyOnProperty(component, 'listItems').and.returnValue(oneSelectedList);
      expect(component.areAnySelected).toBeTrue();
    });
  });
});
