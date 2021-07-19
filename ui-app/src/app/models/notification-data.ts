export enum NotificationTypes {
    INSIGHTS = 'INSIGHTS'
}

export type NotificationType = NotificationTypes.INSIGHTS;

export interface InsightsNotification {
    message: string;
    state: string;
    isDismissable: boolean;
    promptForRefresh: boolean;
    style: string;
}