import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from 'app/services/utility.service';
import { AboutBusinessAutofillResolver } from './about-business-autofill.resolver';
import { LeadService } from 'app/services/lead.service';
import { LoggingService } from 'app/services/logging.service';
import { merchantInfoFactory } from 'app/test-stubs/factories/lead';

describe('AboutBusinessAutofillResolver', () => {
  let resolver: AboutBusinessAutofillResolver;
  let leadService: LeadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        LeadService,
        LoggingService,
        UtilityService
      ]
    });

    leadService = TestBed.inject(LeadService);
    resolver = new AboutBusinessAutofillResolver(leadService);
  });

  it('should be truthy', () => {
    expect(resolver).toBeTruthy();
  });

  it('should return value when undefined', () => {
    leadService.merchantInfo$.next(undefined);
    resolver.resolve().subscribe(
      (res) => {
        expect(res).toBeUndefined();
      },
      () => fail('should not fail')
    );
  });

  it('should return value when set', () => {
    const merchantInfo = merchantInfoFactory.build();
    leadService.merchantInfo$.next(merchantInfo);
    resolver.resolve().subscribe(
      (res) => {
        expect(res).toEqual(merchantInfo);
      },
      () => fail('should not fail')
    );
  });
});
