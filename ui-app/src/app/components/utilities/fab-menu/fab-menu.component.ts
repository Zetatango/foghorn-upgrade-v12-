import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FabMenuItem } from 'app/models/fab-menu';
@Component({
  selector: 'ztt-fab-menu',
  templateUrl: './fab-menu.component.html'
})
export class FabMenuComponent implements OnInit {
  @Input() displayConnectToQuickBooks: boolean;
  @Output() closeEvent = new EventEmitter();
  @Output() openInviteEvent = new EventEmitter();
  @Output() openShareEvent = new EventEmitter();
  @Output() openQuickBooksOpenEvent = new EventEmitter();

  private _menu: Array<FabMenuItem> = [];

  ngOnInit(): void {
    this.initializeMenu();
  }

  private initializeMenu(): void {
    this.menu = [
      {
        titleKey: 'FAB_MENU.CONNECT_QUICKBOOKS',
        icon: 'fa-exchange-alt',
        onClick: (): void => {
          this.openQuickBooksOpenEvent.emit();
        },
        isVisible: (): boolean => this.displayConnectToQuickBooks
      },
      {
        titleKey: 'FAB_MENU.INVITE_CUSTOMERS',
        icon: 'fa-user-plus',
        onClick: (): void => {
          this.openInviteEvent.emit();
        },
        isVisible: (): boolean => true
      },
      {
        titleKey: null,
        icon: 'fa-times',
        onClick: (): void => {
          this.closeEvent.emit();
        },
        isVisible: (): boolean => true
      }
    ];
  }

  get menu(): Array<FabMenuItem> {
    return this._menu;
  }

  set menu(menu: Array<FabMenuItem>) {
    this._menu = menu;
  }
}
