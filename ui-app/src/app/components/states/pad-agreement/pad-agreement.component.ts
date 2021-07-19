import { Component, EventEmitter, Output } from '@angular/core';
import { AgreementType } from 'app/models/agreement';

@Component({
  selector: 'ztt-pad-agreement',
  templateUrl: './pad-agreement.component.html',
  styleUrls: ['./pad-agreement.component.scss']
})
export class PadAgreementComponent {

  @Output() nextEvent = new EventEmitter<void>();
  @Output() backEvent = new EventEmitter<void>();

  get agreementType(): AgreementType {
    return AgreementType.pre_authorized_debit;
  }

  back(): void {
     this.backEvent.emit();
  }

  next(): void {
    this.nextEvent.emit();
  }
}
