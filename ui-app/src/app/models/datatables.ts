export interface DatatablesParams {
  columns: DatatablesColumns[];
  draw: number;
  length: number;
  order: DatatablesOrder[];
  search: DatatablesSearch;
  start: number;
}

export interface DatatablesColumns {
  data: number;
  name: string;
  orderable: boolean;
  search: DatatablesSearch;
  searchable: boolean;
}

export interface DatatablesOrder {
  column: number;
  dir: OrderDirection;
}

export enum OrderDirection {
  ascending = 'asc',
  descending = 'desc'
}

export interface DatatablesSearch {
  regex: boolean;
  value: string;
}

export enum DatatablesButtons {
  edit = 'AUTO_SEND.BUTTON_EDIT',
  cancel = 'AUTO_SEND.BUTTON_CANCEL',
  selectAll = 'AUTO_SEND.BUTTON_SELECT_ALL',
  unselectAll = 'AUTO_SEND.BUTTON_UNSELECT_ALL',
  subscribe = 'AUTO_SEND.BUTTON_SUBSCRIBE',
  unsubscribe = 'AUTO_SEND.BUTTON_UNSUBSCRIBE'
}

