import { Component, OnInit } from '@angular/core';
import { MerchantService } from 'app/services/merchant.service';

/** @deprecated This feature's support is in a state of decay. */
@Component({
  selector: 'ztt-delegated-mode',
  templateUrl: './delegated-mode.component.html'
})
export class DelegatedModeComponent implements OnInit {
  logoutUrl: string;

  constructor(private merchantService: MerchantService) {}

  ngOnInit(): void {
    this.logoutUrl = this.merchantService.logoutUrl;
  }

  get merchantName(): string {
    return this.merchantService.getMerchant()?.name || '';
  }

}
