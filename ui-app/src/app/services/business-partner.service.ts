import { Injectable } from '@angular/core';
import { API_BUSINESS_PARTNER, API_MERCHANT, API_TRACKED_OBJECT } from 'app/constants';
import {
  BusinessPartnerApplication,
  BusinessPartnerApplicationState
} from 'app/models/api-entities/business-partner-application';
import { BusinessPartnerBranding } from 'app/models/api-entities/business-partner-branding';
import { BusinessPartnerBrandingRequestParams } from 'app/models/api-entities/business-partner-branding-request-params';
import { BusinessPartnerCustomerSummary } from 'app/models/api-entities/business-partner-customer-summary';
import { BusinessPartnerProfile } from 'app/models/api-entities/business-partner-profile';
import { BusinessPartnerProfileRequestParams } from 'app/models/api-entities/business-partner-profile-request-params';
import { DatatablesRequestParameters } from 'app/models/api-entities/datatables-request-parameters';
import { InvoiceList } from 'app/models/api-entities/invoice-list';
import { TrackedObject } from 'app/models/api-entities/tracked-object';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UtilityService } from './utility.service';
import { ZttResponse } from 'app/models/api-entities/response';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class BusinessPartnerService {
  private businessPartnerAgreementResponse: BehaviorSubject<BusinessPartnerApplication> = new BehaviorSubject<BusinessPartnerApplication>(null);
  private businessPartnerCustomerSummary: BehaviorSubject<BusinessPartnerCustomerSummary> = new BehaviorSubject<BusinessPartnerCustomerSummary>(null);
  private businessPartnerTrackedObjectHistory: BehaviorSubject<TrackedObject> = new BehaviorSubject<TrackedObject>(null);
  private businessPartnerSentInvoices: BehaviorSubject<InvoiceList> = new BehaviorSubject<InvoiceList>(null);
  private businessPartnerProfile: BehaviorSubject<BusinessPartnerProfile> = new BehaviorSubject<BusinessPartnerProfile>(null);
  private businessPartnerBranding: BehaviorSubject<BusinessPartnerBranding> = new BehaviorSubject<BusinessPartnerBranding>(null);

  static getLastEventFromTrackedObjectState(lastEvent: TrackedObjectState): string {
    let retVal = 'TRACKED_OBJECT.INVITED'; // Default to invited

    if (lastEvent === TrackedObjectState.clicked) {
      retVal = 'TRACKED_OBJECT.CLICKED';
    } else if (lastEvent === TrackedObjectState.created) {
      retVal = 'TRACKED_OBJECT.CREATED';
    } else if (lastEvent === TrackedObjectState.sent) {
      retVal = 'TRACKED_OBJECT.SENT';
    } else if (lastEvent === TrackedObjectState.securityViolation) {
      retVal = 'TRACKED_OBJECT.SECURITY_VIOLATION';
    } else if (lastEvent === TrackedObjectState.viewed) {
      retVal = 'TRACKED_OBJECT.VIEWED';
    } else if (lastEvent === TrackedObjectState.invoiced) {
      retVal = 'TRACKED_OBJECT.INVOICED';
    } else if (lastEvent === TrackedObjectState.linked) {
      retVal = 'TRACKED_OBJECT.LINKED';
    } else if (lastEvent === TrackedObjectState.paid) {
      retVal = 'TRACKED_OBJECT.PAID';
    } else if (lastEvent === TrackedObjectState.createdFromQuickBooks) {
      retVal = 'TRACKED_OBJECT.CREATED_FROM_QUICKBOOKS';
    } else if (lastEvent === TrackedObjectState.updatedFromQuickBooks) {
      retVal = 'TRACKED_OBJECT.UPDATED_FROM_QUICKBOOKS';
    } else if (lastEvent === TrackedObjectState.subscribedAutoSend) {
      retVal = 'TRACKED_OBJECT.SUBSCRIBED_AUTO_SEND';
    } else if (lastEvent === TrackedObjectState.unsubscribedAutoSend) {
      retVal = 'TRACKED_OBJECT.UNSUBSCRIBED_AUTO_SEND';
    }

    return retVal;
  }

  constructor(public http: HttpClient, private utilityService: UtilityService) {}

  getBusinessPartnerApplication(): BehaviorSubject<BusinessPartnerApplication> {
    return this.businessPartnerAgreementResponse;
  }

  /**
   * @warning This method is meant to be used sparsely at service level only.
   */
  setBusinessPartnerApplication(response: BusinessPartnerApplication): void {
    this.businessPartnerAgreementResponse.next(response);
  }

  getBusinessPartnerCustomerSummary(): BehaviorSubject<BusinessPartnerCustomerSummary> {
    return this.businessPartnerCustomerSummary;
  }

  private setBusinessPartnerCustomerSummary(response: BusinessPartnerCustomerSummary): void {
    this.businessPartnerCustomerSummary.next(response);
  }

  getBusinessPartnerTrackedObjectHistory(): BehaviorSubject<TrackedObject> {
    return this.businessPartnerTrackedObjectHistory;
  }

  private setBusinessPartnerTrackedObjectHistory(response: TrackedObject): void {
    this.businessPartnerTrackedObjectHistory.next(response);
  }

  getBusinessPartnerSentInvoices(): BehaviorSubject<InvoiceList> {
    return this.businessPartnerSentInvoices;
  }

  private setBusinessPartnerSentInvoices(response: InvoiceList): void {
    this.businessPartnerSentInvoices.next(response);
  }

  getBusinessPartnerProfile(): BehaviorSubject<BusinessPartnerProfile> {
    return this.businessPartnerProfile;
  }

  private setBusinessPartnerProfile(response: BusinessPartnerProfile): void {
    this.businessPartnerProfile.next(response);
  }

  getBusinessPartnerBranding(): BehaviorSubject<BusinessPartnerBranding> {
    return this.businessPartnerBranding;
  }

  private setBusinessPartnerBranding(response: BusinessPartnerBranding): void {
    this.businessPartnerBranding.next(response);
  }

  fetchBusinessPartnerApplication(merchantId: string, showTerms: boolean): Observable<ZttResponse<BusinessPartnerApplication>> {
    const params = {
      show_terms: showTerms
    };
    const url = this.utilityService.getAugmentedUrl(API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_APPLICATION_PATH.replace(':id', merchantId), params);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<BusinessPartnerApplication>) => this.setBusinessPartnerApplication(res.data))
      );
  }

  inviteBorrower(merchantId: string, emailAddress: string, name: string): Observable<ZttResponse<void>> {
    const params = {
      email: emailAddress,
      name: name,
      send_invite: true
    };
    const url = API_BUSINESS_PARTNER.POST_BUSINESS_PARTNER_INVITE_BORROWER_PATH.replace(':id', merchantId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.post<ZttResponse<void>>(url, UtilityService.trimParameters(params), httpOptions);
  }

  createBusinessCustomer(merchantId: string, emailAddress: string): Observable<ZttResponse<void>> {
    const params = {
      email: emailAddress,
      send_invite: false
    };
    const url = API_BUSINESS_PARTNER.POST_BUSINESS_PARTNER_INVITE_BORROWER_PATH.replace(':id', merchantId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.post<ZttResponse<void>>(url, UtilityService.trimParameters(params), httpOptions);
  }

  getCustomerSummary(merchantId: string, dtParams: DatatablesRequestParameters): Observable<ZttResponse<BusinessPartnerCustomerSummary>> {
    const url = this.utilityService.getAugmentedUrl(API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_MERCHANTS_PATH.replace(':id', merchantId), dtParams);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<BusinessPartnerCustomerSummary>) => {
            const customerSummaryResponse: BusinessPartnerCustomerSummary = res.data;
            this.setBusinessPartnerCustomerSummary(customerSummaryResponse);
          }
        )
      );
  }

  getTrackedObjectEventHistory(trackedObjectId: string, offset: number, limit: number): Observable<ZttResponse<TrackedObject>> {
    const params = {
      offset: offset,
      limit: limit
    };
    const url: string = this.utilityService.getAugmentedUrl(API_TRACKED_OBJECT.GET_TRACKED_OBJECT_EVENTS_PATH.replace(':id', trackedObjectId), params);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<TrackedObject>) => this.setBusinessPartnerTrackedObjectHistory(res.data))
      );
  }

  getSentInvoices(merchantId: string, datatablesParams: DatatablesRequestParameters): Observable<ZttResponse<InvoiceList>> {
    const url = this.utilityService.getAugmentedUrl(API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_SENT_INVOICES_PATH.replace(':id', merchantId), datatablesParams);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<InvoiceList>) => this.setBusinessPartnerSentInvoices(res.data))
      );
  }

  getProfile(merchantId: string): Observable<ZttResponse<BusinessPartnerProfile>> {
    const url = API_BUSINESS_PARTNER.PUT_BUSINESS_PARTNER_PROFILE_PATH.replace(':id', merchantId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<BusinessPartnerProfile>) => this.setBusinessPartnerProfile(res.data))
      );
  }

  updateProfile(merchantId: string, params: BusinessPartnerProfileRequestParams): Observable<ZttResponse<BusinessPartnerProfile>> {
    const url = API_BUSINESS_PARTNER.PUT_BUSINESS_PARTNER_PROFILE_PATH.replace(':id', merchantId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.put(url, UtilityService.trimParameters(params), httpOptions)
      .pipe(
        tap((res: ZttResponse<BusinessPartnerProfile>) => this.setBusinessPartnerProfile(res.data))
      );
  }

  addBrandingAssets(merchantId: string, params: BusinessPartnerBrandingRequestParams): Observable<ZttResponse<BusinessPartnerApplication>> {
    const url = API_MERCHANT.MERCHANTS_BRANDING_PATH.replace(':id', merchantId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.post(url, UtilityService.trimParameters(params), httpOptions)
      .pipe(
        tap((res: ZttResponse<BusinessPartnerApplication>) => this.setBusinessPartnerApplication(res.data))
      );
  }

  editBrandingAssets(merchantId: string, params: BusinessPartnerBrandingRequestParams): Observable<ZttResponse<BusinessPartnerApplication>> {
    const url = API_MERCHANT.MERCHANTS_BRANDING_PATH.replace(':id', merchantId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.put(url, UtilityService.trimParameters(params), httpOptions)
      .pipe(
        tap((res: ZttResponse<BusinessPartnerApplication>) => this.setBusinessPartnerApplication(res.data))
      );
  }

  getBrandingAssets(merchantId: string): Observable<ZttResponse<BusinessPartnerBranding>> {
    const url = API_MERCHANT.MERCHANTS_BRANDING_PATH.replace(':id', merchantId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<BusinessPartnerBranding>) => this.setBusinessPartnerBranding(res.data))
      );
  }

  hasActiveApplication(application: BusinessPartnerApplication): boolean {
    return application?.state === BusinessPartnerApplicationState.complete;
  }

  hasPendingApplication(application: BusinessPartnerApplication): boolean {
    return application?.state === BusinessPartnerApplicationState.pending;
  }
}
