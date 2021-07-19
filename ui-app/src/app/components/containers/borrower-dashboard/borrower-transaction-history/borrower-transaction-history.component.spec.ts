import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BorrowerTransactionHistoryComponent } from './borrower-transaction-history.component';

import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TransactionsService } from 'app/services/transactions.service';
import { CookieService } from 'ngx-cookie-service';
import { UtilityService } from 'app/services/utility.service';
import { FriendlyDatePipe } from 'app/pipes/friendly-date.pipe';
import { ZttDataListType } from 'app/models/data-list-config';
import { SupportedLanguage } from 'app/models/languages';

describe('BorrowerTransactionHistoryComponent', () => {
  let component: BorrowerTransactionHistoryComponent;
  let fixture: ComponentFixture<BorrowerTransactionHistoryComponent>;

  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BorrowerTransactionHistoryComponent,
        FriendlyDatePipe
      ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        CookieService,
        TransactionsService,
        TranslateService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowerTransactionHistoryComponent);
    component = fixture.componentInstance;

    translateService = TestBed.inject(TranslateService);
  });

  describe('configType', () => {
    it('should return BORROWER_TRANSACTION_HISTORY', () => {
      expect(component.configType).toBe(ZttDataListType.BORROWER_TRANSACTION_HISTORY);
    });
  });

  describe('currentLang', () => {
    it('should return value from TranslateService', () => {
      spyOnProperty(translateService, 'currentLang').and.returnValue(SupportedLanguage.default);
      expect(component.currentLang).toEqual(translateService.currentLang);
    });
  });
});
