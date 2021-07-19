import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { SearchBoxComponent } from './search-box.component';

describe('SearchBoxComponent', () => {
  let component: SearchBoxComponent;
  let fixture: ComponentFixture<SearchBoxComponent>;

  const EMPTY_STRING = '';
  const NEW_SEARCH_VALUE = 'something';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), FormsModule],
      declarations: [SearchBoxComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.searchInputChanged).toBeDefined();
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from and complete observable', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  });

  describe('onSearchChangeEvent', () => {
    it('should call next on searchChanged when called', () => {
      spyOn(component.searchInputChanged, 'next');
      component.onSearchChangeEvent();

      expect(component.searchInputChanged.next).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearSearch', () => {
    it('clear searchValue and emit that value', () => {
      spyOn(component.searchChangeEvent, 'emit');
      component.searchValue = NEW_SEARCH_VALUE;
      component.clearSearch();

      expect(component.searchValue).toBe(EMPTY_STRING);
      expect(component.searchChangeEvent.emit).toHaveBeenCalledOnceWith(EMPTY_STRING);
    });
  });

  describe('on search change', () => {
    it('should emit event with new value', fakeAsync(() => {
      spyOn(component.searchChangeEvent, 'emit');
      component.searchValue = NEW_SEARCH_VALUE;
      tick(1000);
      component.onSearchChangeEvent();
      tick(1000);

      expect(component.searchChangeEvent.emit).toHaveBeenCalledOnceWith(NEW_SEARCH_VALUE);
    }));
  });
});
