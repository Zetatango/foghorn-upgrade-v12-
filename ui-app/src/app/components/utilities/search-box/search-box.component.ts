import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ztt-search-box',
  templateUrl: './search-box.component.html',
})

export class SearchBoxComponent implements OnDestroy {
  @Output() searchChangeEvent: EventEmitter<string> = new EventEmitter<string>();

  private _searchValue: string;
  private _searchInputChanged: Subject<string> = new Subject<string>();

  unsubscribe$ = new Subject<void>();

  constructor() {
    this._searchInputChanged
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(() => this.executeSearch());
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  clearSearch(): void {
    this._searchValue = '';
    this.searchChangeEvent.emit(this._searchValue);
  }

  onSearchChangeEvent(): void {
    this._searchInputChanged.next(this._searchValue);
  }

  private executeSearch(): void {
    this.searchChangeEvent.emit(this._searchValue);
  }

  get searchValue(): string {
    return this._searchValue;
  }

  set searchValue(value: string) {
    this._searchValue = value;
  }

  get searchInputChanged(): Subject<string> {
    return this._searchInputChanged;
  }
}
