import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AccountBalanceChartComponent } from './account-balance-chart.component';
import { InsightsService } from 'app/services/insights.service';
import { UtilityService } from 'app/services/utility.service';
import { insightsDataFactory } from 'app/test-stubs/factories/insights-data';
import { CustomLineChartService } from '../../services/line-chart.service';
import { LocalizeDatePipe } from '../../pipes/localize-date.pipe';
import { BankAccountService } from 'app/services/bank-account.service';
import { leadFactory } from 'app/test-stubs/factories/lead';
import { MerchantService } from 'app/services/merchant.service';

describe('AccountBalanceChartComponent', () => {
  let component: AccountBalanceChartComponent;
  let fixture: ComponentFixture<AccountBalanceChartComponent>;

  let insightsService: InsightsService;
  let translateService: TranslateService;
  let bankAccountService: BankAccountService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AccountBalanceChartComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        BankAccountService,
        InsightsService,
        UtilityService,
        TranslateService,
        LocalizeDatePipe,
        MerchantService,
        CustomLineChartService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(AccountBalanceChartComponent);
    component = fixture.componentInstance;
    insightsService = TestBed.inject(InsightsService);
    translateService = TestBed.inject(TranslateService);
    bankAccountService = TestBed.inject(BankAccountService);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('ngOnInit', () => {
    it('should not set add a reference line when the desiredBankAccountBalance is null', () => {
      component.ngOnInit();
      bankAccountService.setBankAccountOwner(null);


      expect(component.refLines.length).toEqual(0);
    });

    it('should initialize currentLang', () => {
      bankAccountService.setBankAccountOwner(leadFactory.build({ desired_bank_account_balance: 500 }));
      spyOnProperty(translateService, 'currentLang').and.returnValue('en');

      component.ngOnInit();

      expect(component.currentLang).toBe('en');
    });

    it('should change the current lang', function () {
      spyOnProperty(translateService, 'onLangChange', 'get').and.returnValue(of({ lang: 'fr' }));
      component.ngOnInit();

      expect(component.currentLang).toBe('fr');
    });

    describe('when account balance is not empty', () => {
      const accountBalance = insightsDataFactory.buildList(1);

      beforeEach(() => {
        insightsService.accountBalanceData$.next(accountBalance);
      });

      it('should populate the account balance data with the insight service account balance data', () => {
        bankAccountService.setBankAccountOwner(leadFactory.build({ desired_bank_account_balance: 500 }));

        component.ngOnInit();
        expect(component.accountBalanceData).toEqual(accountBalance);
      });

      it('should set add a reference line with a value', () => {
        const desiredBankAccountBalance = 450;
        bankAccountService.setBankAccountOwner(leadFactory.build({ desired_bank_account_balance: desiredBankAccountBalance }));

        component.ngOnInit();

        expect(component.refLines[0].value).toBe(desiredBankAccountBalance);
      });

      it('should not set add a reference line with a value greater than max', () => {
        const desiredBankAccountBalance = 100000;
        bankAccountService.setBankAccountOwner(leadFactory.build({ desired_bank_account_balance: desiredBankAccountBalance }));

        component.ngOnInit();

        expect(component.refLines.length).toEqual(0);
      });

      it('should not set add a reference line with a value less than min', () => {
        const desiredBankAccountBalance = -100000;
        bankAccountService.setBankAccountOwner(leadFactory.build({ desired_bank_account_balance: desiredBankAccountBalance }));

        component.ngOnInit();

        expect(component.refLines.length).toEqual(0);
      });
    });
  });

  describe('formatYAxisTicksFN', () => {
    it('should put dollar sign before the number when language is "en"', () => {
      component.currentLang = 'en';
      expect(component.formatYAxisTick('123.45')).toEqual('$123.45');
    });

    it('should put dollar sign after the number when language is "fr"', () => {
      component.currentLang = 'fr';
      expect(component.formatYAxisTick('123.45')).toEqual('123.45$');
    });
  });

  describe('formatXAxisTicksFN', () => {
    it('should get the first three letters of a month name', function () {
      const date = '01.01.2021';
      component.currentLang = 'en';
      expect(component.formatXAxisTicksFN(date)).toBe('1-Jan');
    });
  });

  describe('renderChart', () => {
    it('should set account balance to empty array', () => {
      component.accountBalanceData = null;
      component.renderChart();
      expect(component.accountBalanceData).toEqual([]);
    });
  });
});
