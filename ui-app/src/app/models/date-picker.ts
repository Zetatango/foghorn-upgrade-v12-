import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';

export interface DatePickerConfig {
  config: Partial<BsDatepickerConfig>;
  mask: { mask: string };
  format: string;
  formatDateFns: string;
  placeholder: string;
  regex: RegExp;
}
