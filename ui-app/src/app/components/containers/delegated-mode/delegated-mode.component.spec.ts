import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';


import { DelegatedModeComponent } from './delegated-mode.component';

import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';

import { merchantDataFactory } from 'app/test-stubs/factories/merchant';

describe('DelegatedModeComponent', () => {
  let component: DelegatedModeComponent;
  let fixture: ComponentFixture<DelegatedModeComponent>;

  let merchantService: MerchantService;

  let getMerchantSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot(), HttpClientTestingModule ],
      declarations: [ DelegatedModeComponent ],
      providers: [
        MerchantService,
        LoggingService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DelegatedModeComponent);
    component = fixture.componentInstance;

    merchantService = TestBed.inject(MerchantService);

    getMerchantSpy = spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('get merchantName', () => {
    it('should return expected merchant if merchant is set', () => {
      const expectedMerchant = merchantDataFactory.build();

      expect(component.merchantName).toEqual(expectedMerchant.name);
    });

    it('should return blank string if merchant is null-like', () => {
      [undefined, null].forEach(nullishValue => {
        getMerchantSpy.and.returnValue(nullishValue);

        expect(component.merchantName).toEqual('');
      }); // forEach
    });
  });

}); // describe - DelegatedModeComponent
