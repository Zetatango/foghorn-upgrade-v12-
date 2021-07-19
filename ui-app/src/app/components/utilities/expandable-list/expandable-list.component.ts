import { Component, OnInit, Input, TemplateRef, Output, EventEmitter } from '@angular/core';
import { ExpandableListStatus, ExpandableListItem, ExpandableListItemDataType } from 'app/models/expandable-list';
import { AutoSendParams } from 'app/models/api-entities/business-partner-customer-summary';

@Component({
  selector: 'ztt-expandable-list',
  templateUrl: './expandable-list.component.html'
})
export class ExpandableListComponent implements OnInit {
  private _listItems: ExpandableListItem[] = [];
  private _status: ExpandableListStatus;

  @Output() nextEvent = new EventEmitter<string>();
  @Output() toggleEditEvent = new EventEmitter();
  @Output() finishEditEvent = new EventEmitter<AutoSendParams>();

  @Input() disableScroll: boolean;
  @Input() listStatus: ExpandableListStatus;
  @Input() primaryTemplate: TemplateRef<Element>;
  @Input() secondaryTemplate: TemplateRef<Element>;
  @Input() editTemplate: TemplateRef<Element>;
  @Input() missingDataMessage: string;
  @Input() isEditing: boolean;
  @Input()
  set data(array: any[]) { // eslint-disable-line
    this.listItems = array.map((value, i) => this.createMenuItem(value, i));
  }

  ngOnInit(): void {
    this.status = ExpandableListStatus.VIEW;
  }

  onScroll(): void {
    this.nextEvent.emit();
  }

  toggle(listItem: ExpandableListItem): void {
    listItem.isOpen ? this.close(listItem) : this.open(listItem);
  }

  private createMenuItem(value: ExpandableListItemDataType, listItemIndex: number): ExpandableListItem {
    const oldValue = this.listItems && this.listItems[listItemIndex];

    const menuItem: ExpandableListItem = {
      isOpen: !!oldValue?.isOpen,
      isSelected: !!oldValue?.isSelected,
      data: value
    };
    return menuItem;
  }

  private open(listItem: ExpandableListItem): void {
    listItem.isOpen = true;
  }

  private close(listItem: ExpandableListItem): void {
    listItem.isOpen = false;
  }

  get listItems(): ExpandableListItem[] {
    return this._listItems;
  }

  set listItems(value: ExpandableListItem[]) {
    this._listItems = value;
  }

  get status(): ExpandableListStatus {
    return this._status;
  }

  set status(value: ExpandableListStatus) {
    this._status = value;
  }

  get areAllSelected(): boolean {
    return !!this.listItems.length && !this.listItems.find((li: ExpandableListItem) => !li.isSelected);
  }

  get areAnySelected(): boolean {
    return !!this.listItems.some((li: ExpandableListItem) => li.isSelected);
  }
}
