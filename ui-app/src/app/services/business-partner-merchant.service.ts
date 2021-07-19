import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UtilityService } from './utility.service';
import { API_BUSINESS_PARTNER_MERCHANT } from 'app/constants';
import { Invoice } from 'app/models/api-entities/invoice';
import { BusinessPartnerMerchant } from 'app/models/api-entities/business-partner-customer-summary';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable()
export class BusinessPartnerMerchantService {
  private businessPartnerMerchantInvoiceResponse: BehaviorSubject<Invoice> = new BehaviorSubject<Invoice>(null);

  constructor(private http: HttpClient,
              private utilityService: UtilityService) {}

  getBusinessPartnerMerchantInvoiceApplication(): BehaviorSubject<Invoice> {
    return this.businessPartnerMerchantInvoiceResponse;
  }

  private setBusinessPartnerMerchantInvoiceApplication(response: Invoice): void {
    this.businessPartnerMerchantInvoiceResponse.next(response);
  }

  sendInvoice(businessPartnerMerchantId: string,
              invoiceNumber: string,
              accountNumber: string,
              amount: number,
              merchantDocumentId: string,
              dueDate: string): Observable<ZttResponse<Invoice>> {
    const params = {
      id: businessPartnerMerchantId,
      invoice_number: invoiceNumber,
      account_number: accountNumber,
      amount: amount,
      merchant_document_id: merchantDocumentId,
      due_date: dueDate
    };
    const url = API_BUSINESS_PARTNER_MERCHANT.POST_INVOICE.replace(':id', businessPartnerMerchantId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.post(url, UtilityService.trimParameters(params), httpOptions)
      .pipe(
        tap((res: ZttResponse<Invoice>) => {
          const invoice: Invoice = res.data;
          this.setBusinessPartnerMerchantInvoiceApplication(invoice);
        })
      );
  }

  hasSmallBusinessGrade(merchant: BusinessPartnerMerchant): boolean {
    return !!(this.hasLinkedMerchant(merchant) && merchant.linked_merchants[0].small_business_grade);
  }

  hasAvailableAmount(merchant: BusinessPartnerMerchant): boolean {
    return !!(this.hasLinkedMerchant(merchant) && merchant.linked_merchants[0].available_amount);
  }

  hasLinkedMerchant(merchant: BusinessPartnerMerchant): boolean {
    return !!(merchant && merchant.linked_merchants && merchant.linked_merchants[0]);
  }

  hasDifferentSignupEmail(merchant: BusinessPartnerMerchant): boolean {
    return !!(merchant && merchant.email && merchant.sign_up_email && merchant.email !== merchant.sign_up_email);
  }

  hasDifferentSignupName(merchant: BusinessPartnerMerchant): boolean {
    return !!(merchant && merchant.email && merchant.sign_up_name && merchant.name !== merchant.sign_up_name);
  }

  hasDifferentSignupProperties(merchant: BusinessPartnerMerchant): boolean {
    return this.hasDifferentSignupEmail(merchant) || this.hasDifferentSignupName(merchant);
  }

  hasAutoPay(merchant: BusinessPartnerMerchant): boolean {
    return !!(this.hasLinkedMerchant(merchant) && merchant.linked_merchants[0].paf_opt_in);
  }

  hasAutoSend(merchant: BusinessPartnerMerchant): boolean {
    return !!merchant.auto_send;
  }

  getAutoPayStatus(merchant: BusinessPartnerMerchant): string {
    return this.hasAutoPay(merchant) ? 'PARTNER_DASHBOARD.CUSTOMER_SUMMARY.PAYMENT_PLAN' : 'PARTNER_DASHBOARD.CUSTOMER_SUMMARY.MANUAL_PAY';
  }

  getAutoSendStatus(merchant: BusinessPartnerMerchant): string {
    return this.hasAutoSend(merchant) ? 'PARTNER_DASHBOARD.CUSTOMER_SUMMARY.AUTO_SEND' : 'PARTNER_DASHBOARD.CUSTOMER_SUMMARY.MANUAL_SEND';
  }

  getCustomerSource(merchant: BusinessPartnerMerchant): string {
    return (merchant && merchant.quickbooks_customer_id) ? 'DATA_SOURCE.QUICKBOOKS' : null;
  }

  subscribeToAutoSend(merchantsIds: string[], autoSend: boolean): Observable<ZttResponse<void>> {
    const url = API_BUSINESS_PARTNER_MERCHANT.PUT_SUBSCRIBE;
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const params = {
      business_partner_merchants_ids: merchantsIds,
      auto_send: autoSend
    };
    return this.http.put<ZttResponse<void>>(url, UtilityService.trimParameters(params), httpOptions);
  }
}
