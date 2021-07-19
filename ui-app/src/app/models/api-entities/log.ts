export interface LogMessage {
  message: string;
  severity: LogSeverity;
}

export enum LogSeverity {
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error'
}
