import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { SupportedLanguage } from 'app/models/languages';

@Component({
  selector: 'ztt-lang-selector',
  templateUrl: './lang-selector.component.html'
})
export class LangSelectorComponent implements OnInit, OnDestroy {
  unsubscribe$ = new Subject<void>();
  languageFlag: string;

  constructor(public translateService: TranslateService) {}

  ngOnInit(): void {
    this.languageFlag = this.inactiveLanguage;
    this.updateIntercomLanguage();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  toggleLanguage(): void {
    this.translateService.use(this.inactiveLanguage)
      .pipe(take(1))
      .subscribe(() => {
        this.languageFlag = this.inactiveLanguage;
      });
  }

  updateIntercomLanguage(): void {
    const intercom = (window as any).Intercom; // eslint-disable-line
    if (!intercom) return;

    this.translateService.onLangChange
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((event: LangChangeEvent) => {
        intercom('update', { language_override: event.lang });
    });
  }

  private get inactiveLanguage(): string {
    return this.translateService.currentLang === SupportedLanguage.fr ? SupportedLanguage.en : SupportedLanguage.fr;
  }
}
