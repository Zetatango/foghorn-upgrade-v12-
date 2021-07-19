import { Component, HostBinding, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { QuickbooksService } from 'app/services/quickbooks.service';
import { asSupportedLanguage } from 'app/models/languages';
import { Subject } from 'rxjs';

@Component({
  selector: 'ztt-quickbooks-connect-button',
  templateUrl: './quickbooks-connect-button.component.html'
})
export class QuickbooksConnectButtonComponent {
  @HostBinding('attr.id')
  componentID = 'ztt-quickbooks-connect-button';
  unsubscribe$ = new Subject<void>();

  @Input() openModal = false;

  constructor(
    private quickbooksService: QuickbooksService,
    private translateService: TranslateService
  ) {}

  quickbooksConnectButtonImage(): string {
    const lang = asSupportedLanguage(this.translateService.currentLang);
    return `/assets/quickbooks/quickbooks-button-${lang}.png`;
  }

  quickbooksStartFlowUrl(): string {
    return this.quickbooksService.quickbooksAuthUrl(this.translateService.currentLang);
  }

  connectQuickbooks(): void {
    this.quickbooksService.initiateAuthFlow();
  }
}
