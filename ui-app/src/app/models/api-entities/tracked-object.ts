import { OrderDirection } from 'app/models/datatables';
import { TrackedObjectState } from 'app/models/tracked-object-state';

export interface TrackedObject {
  filtered_count: number;
  limit: number;
  offset: number;
  order_by: string;
  order_direction: OrderDirection;
  total_count: number;
  tracked_object_events: TrackedObjectEvent[];
}

export interface TrackedObjectEvent {
  created_at: string;
  event: TrackedObjectState;
}
