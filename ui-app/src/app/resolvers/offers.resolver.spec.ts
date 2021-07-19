import { TestBed } from '@angular/core/testing';

import { OffersResolver } from './offers.resolver';
import { OfferService } from 'app/services/offer.service';
import { LoggingService } from 'app/services/logging.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from 'app/services/utility.service';
import { of } from 'rxjs';
import { StateRoutingService } from 'app/services/state-routing.service';
import { RouterTestingModule } from '@angular/router/testing';
import { throwError } from 'rxjs/internal/observable/throwError';
import { AppRoutes } from 'app/models/routes';

describe('OfferResolver', () => {
  let resolver: OffersResolver;
  let offerService: OfferService;
  let stateRoutingService: StateRoutingService;
  let offersSpy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      providers: [
        OfferService,
        LoggingService,
        UtilityService,
        StateRoutingService
      ]
    });

    offerService = TestBed.inject(OfferService);
    stateRoutingService = TestBed.inject(StateRoutingService);
    offersSpy = spyOn(offerService, 'loadOffers$');
    resolver = TestBed.inject(OffersResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  it('should call loadOffer$', () => {
    offersSpy.and.returnValue(of(null));
    resolver.resolve().subscribe(
      () => expect(offerService.loadOffers$).toHaveBeenCalledTimes(1),
      () => fail('should not fail')
    );
  });

  it('should call stateRoutingService on error', function () {
    offersSpy.and.returnValue(throwError(null));
    spyOn(stateRoutingService, 'navigate');
    resolver.resolve().subscribe((res) => {
      expect(offerService.loadOffers$).toHaveBeenCalledTimes(1);
      expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.error.no_offers);
      expect(res).toEqual(null);
    }, () => fail('should not fail'));
  });
});
