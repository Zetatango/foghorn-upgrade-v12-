// @angular
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';

// Services
import { StateRoutingService } from 'app/services/state-routing.service';
import { SupplierService } from 'app/services/supplier.service';
import { MerchantService } from 'app/services/merchant.service';
import { ErrorService } from 'app/services/error.service';
import { BorrowerInvoiceService} from 'app/services/borrower-invoice.service';
import { ConfigurationService } from 'app/services/configuration.service';

// Models
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';

// Entities
import { Supplier, SupplierInformation } from 'app/models/api-entities/supplier';
import { Merchant } from 'app/models/api-entities/merchant';

// rxjs
import { Subscription } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";

@Component({
  selector: 'ztt-select-payee',
  templateUrl: './select-payee.component.html'
})
export class SelectPayeeComponent implements OnInit, OnDestroy {
  payeeTypeFormGroup = this.fb.group({
    payeeType: ['payee-self', Validators.required]
  });

  get payeeType(): AbstractControl { return this.payeeTypeFormGroup.get('payeeType'); }

  selectSupplierFormGroup = this.fb.group({
    payee: ['', Validators.required],
    invoiceNumber: ['', Validators.required],
    accountNumber: ['']
  });

  get payee(): AbstractControl { return this.selectSupplierFormGroup.get('payee'); }
  get invoiceNumber(): AbstractControl { return this.selectSupplierFormGroup.get('invoiceNumber'); }
  get accountNumber(): AbstractControl { return this.selectSupplierFormGroup.get('accountNumber'); }

  suppliers: Supplier[];
  private suppliersSubscription$: Subscription;
  merchant: Merchant;
  loaded = false;

  constructor(private configurationService: ConfigurationService,
              private stateRoutingService: StateRoutingService,
              private supplierService: SupplierService,
              private merchantService: MerchantService,
              private borrowerInvoiceService: BorrowerInvoiceService,
              private errorService: ErrorService,
              private fb: FormBuilder) {}

  ngOnInit(): void {
    // If we got here, we don't want to use any previously viewed invoice
    this.borrowerInvoiceService.clearActiveInvoice();
    this.merchant = this.merchantService.getMerchant();
    this.loadSuppliers();
  }

  ngOnDestroy(): void {
    if (this.suppliersSubscription$) {
      this.suppliersSubscription$.unsubscribe();
    }
  }

  // TODO: remove locEnabled() once LoC is live.
  /* istanbul ignore next */
  get locEnabled(): boolean {
    return this.configurationService.locEnabled;
  }

  get isPayeeSupplierAndInvalid(): boolean {
    return this.payeeType.value === 'payee-supplier' && this.selectSupplierFormGroup.invalid;
  }

  loadSuppliers(): void {
    this.supplierService.loadSuppliers()
      .pipe(take(1))
      .subscribe(
        () => this.setSuppliersSubscription(),
        () => {
          this.errorService.show(UiError.getSuppliers);
        });
  }

  setSuppliersSubscription(): void {
    this.suppliersSubscription$ = this.supplierService.getSuppliers()
      .pipe(
        tap(() => this.loaded = true)
      )
      .subscribe((suppliers: Supplier[]) => {
        this.suppliers = suppliers;
      });
  }

  saveSelectedSupplier(): void {
    const selectedSupplier = this.suppliers
      .filter((supplier: Supplier) => supplier.id === this.payee.value);

    if (selectedSupplier.length === 1) {
      const selectedSupplierInformation: SupplierInformation = {
        ...selectedSupplier[0],
        account_number: this.accountNumber.value.trim(),
        invoice_number: this.invoiceNumber.value.trim()
      };

      this.supplierService.setCurrentSupplierInformation(selectedSupplierInformation);
    }
  }

  get dashboardLink(): string {
    return AppRoutes.dashboard.root_link;
  }

  next(): void {
    // save the selected supplier if paying supplier, else navigate.
    if (this.payeeType.value === 'payee-supplier') {
      this.saveSelectedSupplier();
      const supplierId = this.payee.value;
      const invoiceNumber = this.invoiceNumber.value;

      this.borrowerInvoiceService.findExistingInvoice(this.merchant.id, supplierId, invoiceNumber)
        .pipe(take(1))
        .subscribe(
          () => this.stateRoutingService.navigate(AppRoutes.application.select_lending_offer, true),
          (e: ErrorResponse) => {
            Bugsnag.notify(e);
            this.errorService.show(UiError.general);
          }
        );
    } else {
      this.stateRoutingService.navigate(AppRoutes.application.select_lending_offer, true);
    }
  }
}
