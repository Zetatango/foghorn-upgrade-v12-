import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from 'app/services/utility.service';
import { AboutYouAutofillResolver } from './about-you-autofill.resolver';
import { LeadService } from 'app/services/lead.service';
import { LoggingService } from 'app/services/logging.service';
import { applicantInfoFactory } from 'app/test-stubs/factories/lead';

describe('AboutYouAutofillResolver', () => {
  let resolver: AboutYouAutofillResolver;
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
    resolver = new AboutYouAutofillResolver(leadService);
  });

  it('should be truthy', () => {
    expect(resolver).toBeTruthy();
  });

  it('should return value when undefined', () => {
    leadService.applicantInfo$.next(undefined);
    resolver.resolve().subscribe(
      (res) => {
        expect(res).toBeUndefined();
      },
      () => fail('should not fail')
    );
  });

  it('should return value when set', () => {
    const applicantInfo = applicantInfoFactory.build();
    leadService.applicantInfo$.next(applicantInfo);
    resolver.resolve().subscribe(
      (res) => {
        expect(res).toEqual(applicantInfo);
      },
      () => fail('should not fail')
    );
  });
});
