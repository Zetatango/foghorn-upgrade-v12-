import { GOOGLE_TAG_MANAGER } from 'app/constants/google-tag-manager.constants';

export class GoogleTagManagerEvent {
  buttonClicked?: string;
  currentPage?: string;
  event?: string;
  eventAction?: string;
  eventCategory?: string;
  eventLabel?: string;
  industry?: string;
  tabClicked?: string;

  constructor(event: Partial<GoogleTagManagerEvent>) {
    this.buttonClicked = event?.buttonClicked;
    this.currentPage = event?.currentPage;
    this.event = GOOGLE_TAG_MANAGER.ARIO;
    this.eventAction = event?.eventAction;
    this.eventCategory = event?.eventCategory;
    this.eventLabel = event?.eventLabel;
    this.industry = event?.industry;
    this.tabClicked = event?.tabClicked;
  }
}


export class GoogleTagManagerInitEvent {
  email: string;
  userId: string;

  constructor(event: GoogleTagManagerInitEvent) {
    this.email = event.email;
    this.userId = event.userId;
  }
}
