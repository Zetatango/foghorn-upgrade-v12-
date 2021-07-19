/**
 * This file contains type definitions for UI-related alerts.
 */

export enum UiAlertStatus {
  success = 'success',
  danger = 'danger'
}

export interface UiAlertParams {
  realm_id?: string;
  filename?: string
}

export interface UiAlert {
  type: UiAlertStatus;
  msg: string;
  params?: UiAlertParams;
  timeout?: number;
}
