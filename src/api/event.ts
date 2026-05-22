import { callFunction } from '@/utils/cloud';
import type { IGrowthEvent, EventType } from '@/interface';

export function getEventList(plantId: string) {
  return callFunction<IGrowthEvent[]>('event', { action: 'list', plantId });
}

export function createEvent(
  plantId: string,
  familyId: string,
  data: { type: EventType; eventDate: string; description?: string; photos?: string[] },
) {
  return callFunction('event', { action: 'create', plantId, familyId, data });
}
