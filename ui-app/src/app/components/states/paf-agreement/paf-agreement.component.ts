import { Component, EventEmitter, Output } from '@angular/core';
import { AgreementType } from 'app/models/agreement';

@Component({
  selector: 'ztt-paf-agreement',
  templateUrl: './paf-agreement.component.html',
  styleUrls: ['./paf-agreement.component.scss']
})
export class PafAgreementComponent {

  @Output() nextEvent = new EventEmitter<void>();
  @Output() backEvent = new EventEmitter<void>();

  get agreementType(): AgreementType {
    return AgreementType.pre_authorized_financing;
  }

  back(): void {
    this.backEvent.emit();
  }

  next(): void {
    this.nextEvent.emit();
  }
}
