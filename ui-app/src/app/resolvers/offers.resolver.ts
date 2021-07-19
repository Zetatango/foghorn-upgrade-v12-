import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of, } from 'rxjs';
import { OfferService } from 'app/services/offer.service';
import { ZttResponse } from 'app/models/api-entities/response';
import { Offer } from 'app/models/api-entities/offer';
import { catchError } from 'rxjs/operators';
import { AppRoutes } from 'app/models/routes';
import { StateRoutingService } from '../services/state-routing.service';

@Injectable({
  providedIn: 'root'
})
export class OffersResolver implements Resolve<ZttResponse<Offer[]>> {

  constructor(
    private offerService: OfferService,
    private stateRoutingService: StateRoutingService
  ) {
  }

  resolve(): Observable<ZttResponse<Offer[]>> {
    return this.offerService.loadOffers$().pipe(catchError(() => {
      this.stateRoutingService.navigate(AppRoutes.error.no_offers);
      return of(null);
    }));
  }
}
