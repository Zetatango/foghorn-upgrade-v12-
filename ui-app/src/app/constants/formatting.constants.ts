import { DatePickerConfig } from 'app/models/date-picker';

export const BUSINESS_NUM_REGEX = new RegExp('^[a-zA-Z0-9-]*$');

export const CURRENCY_CLEAVE_CONFIG = {
  numeral: true,
  numeralThousandsGroupStyle: 'none',
  numeralPositiveOnly: true
};

export const NUMERAL_CLEAVE_CONFIG = {
  blocks: [8],
  numericOnly: true,
  numeralPositiveOnly: true
};

export const DD_MM_YYYY_FORMAT = 'DD-MM-YYYY';
export const dd_MM_yyyy_FORMAT = 'dd-MM-yyyy';

export const DD_MM_YYYY_MASK_CONFIG = {
  mask: '00-00-0000'
};
export const DD_MM_YYYY_REGEX = new RegExp('^[0-9]{2}-[0-9]{2}-[0-9]{4}$');
export const DD_MM_YYYY_DATEPICKER_CONFIG: DatePickerConfig = {
  config: {
    dateInputFormat: DD_MM_YYYY_FORMAT
  },
  mask: DD_MM_YYYY_MASK_CONFIG,
  format: DD_MM_YYYY_FORMAT,
  formatDateFns: dd_MM_yyyy_FORMAT,
  placeholder: 'DATE_PICKER.PLACEHOLDER_DD_MM_YYYY',
  regex: DD_MM_YYYY_REGEX
};

export const MM_YYYY_FORMAT = 'MM-YYYY';
export const MM_yyyy_FORMAT = 'MM-yyyy';
export const MM_YYYY_MASK_CONFIG = {
  mask: '00-0000'
};
export const MM_YYYY_REGEX = new RegExp('^[0-9]{2}-[0-9]{4}$');
export const MM_YYYY_DATEPICKER_CONFIG: DatePickerConfig = {
  config: {
    minMode: 'month',
    dateInputFormat: MM_YYYY_FORMAT
  },
  mask: MM_YYYY_MASK_CONFIG,
  format: MM_YYYY_FORMAT,
  formatDateFns: MM_yyyy_FORMAT,
  placeholder: 'DATE_PICKER.PLACEHOLDER_MM_YYYY',
  regex: MM_YYYY_REGEX
};

export const PHONE_MASK_CONFIG = {
  mask: '(000) 000-0000'
};
export const PHONE_REGEX = new RegExp('^[(][0-9]{3}[)][ ][0-9]{3}[-][0-9]{4}$');

export const POSTAL_CODE_MASK_CONFIG = {
  mask: 'a0a 0a0'
};
export const POSTAL_CODE_REGEX = new RegExp('([a-zA-Z][0-9][a-zA-Z][ ][0-9][a-zA-Z][0-9])|([a-zA-Z][0-9][a-zA-Z][0-9][a-zA-Z][0-9])');

export const SIN_MASK_CONFIG = {
  mask: '000 000 000'
};
