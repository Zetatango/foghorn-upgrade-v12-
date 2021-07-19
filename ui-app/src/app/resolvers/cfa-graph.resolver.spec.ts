import { TestBed } from '@angular/core/testing';
import { LoggingService } from 'app/services/logging.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from 'app/services/utility.service';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { throwError } from 'rxjs/internal/observable/throwError';
import { CfaGraphResolver } from './cfa-graph.resolver';
import { InsightsService } from 'app/services/insights.service';
import { ErrorResponse } from 'app/models/error-response';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { AppRoutes } from 'app/models/routes';
import { StateRoutingService } from 'app/services/state-routing.service';
import { bankAccountDetailsFactory } from "../test-stubs/factories/bank-account-details";
import { BankAccountService } from 'app/services/bank-account.service';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { MerchantService } from 'app/services/merchant.service';

describe('CfaGraphResolver', () => {
  let resolver: CfaGraphResolver;
  let insightsService: InsightsService;
  let stateRoutingService: StateRoutingService;
  let bankAccountService: BankAccountService;

  let fetchCashFlowSpy, fetchAccountBalanceSpy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        BankAccountService,
        InsightsService,
        MerchantService,
        StateRoutingService,
        LoggingService,
        UtilityService
      ]
    });

    
    insightsService = TestBed.inject(InsightsService);
    stateRoutingService = TestBed.inject(StateRoutingService);
    bankAccountService = TestBed.inject(BankAccountService);

    fetchCashFlowSpy = spyOn(insightsService, 'fetchCashFlowData');
    fetchAccountBalanceSpy = spyOn(insightsService, 'fetchAccountBalanceData');

    spyOn(stateRoutingService, 'navigate');
    resolver = TestBed.inject(CfaGraphResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  describe('insights enabled', () => {
    it('should call insights functions', () => {
      fetchCashFlowSpy.and.returnValue(of(null));
      fetchAccountBalanceSpy.and.returnValue(of(null));
      resolver.resolve().subscribe(
        () => {
          expect(insightsService.fetchCashFlowData).toHaveBeenCalledTimes(1);
          expect(insightsService.fetchAccountBalanceData).toHaveBeenCalledTimes(1);
        },
        () => fail('should not fail')
      );
    });

    it('should call insights functions with the correct value', () => {
      const bankAccounts = [
        bankAccountDetailsFactory.build({
          flinks_account_uuid: 'uuid1',
          id: 'ba_123'
        }),
        bankAccountDetailsFactory.build({
          flinks_account_uuid: 'uuid2',
          id: 'ba_234'
        })
      ];
      const owner = merchantDataFactory.build({ selected_insights_bank_accounts_details: bankAccounts })
      bankAccountService.setBankAccountOwner(owner);

      fetchCashFlowSpy.and.returnValue(of(null));
      fetchAccountBalanceSpy.and.returnValue(of(null));

      resolver.resolve().subscribe(
        () => {
          expect(insightsService.fetchCashFlowData).toHaveBeenCalledOnceWith(['uuid1', 'uuid2']);
          expect(insightsService.fetchAccountBalanceData).toHaveBeenCalledOnceWith(['uuid1', 'uuid2']);
        },
        () => fail('should not fail')
      );
    });

    it('should catch error from insights functions', () => {
      fetchCashFlowSpy.and.returnValue(throwError(new ErrorResponse(internalServerErrorFactory.build())));
      fetchAccountBalanceSpy.and.returnValue(of(null));
      resolver.resolve().subscribe(
        () => {
          expect(insightsService.fetchCashFlowData).toHaveBeenCalledTimes(1);
          expect(insightsService.fetchAccountBalanceData).toHaveBeenCalledTimes(1);
          expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.insights.no_insights_data, true);
        },
        () => fail('should not fail')
      );
    });
  });
});
