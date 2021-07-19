export class ErrorModalContext {
  heading: string;
  messages: string[];
  route_destination: string; // where to route to on hide
  skipLocationChange: boolean; // skip URL change on route.

  constructor (
    heading: string,
    messages: string[],
    route_destination?: string,
    skipLocationChange = false
  ) {
    this.heading = heading;
    this.messages = messages;
    this.route_destination = route_destination;
    this.skipLocationChange = skipLocationChange;
  }
}
