import { callFunction } from '@/utils/cloud';
import type { ICareConfig, ICareRecord, IReminder, CareType } from '@/interface';

export function getConfigs(plantId: string) {
  return callFunction<ICareConfig[]>('care', { action: 'getConfigs', plantId });
}

export function toggleConfig(configId: string, enabled: boolean) {
  return callFunction('care', { action: 'toggleConfig', configId, enabled });
}

export function updateInterval(configId: string, intervalDays: number) {
  return callFunction('care', { action: 'updateInterval', configId, intervalDays });
}

export function recordCare(plantId: string, familyId: string, type: CareType, note?: string) {
  return callFunction('care', { action: 'record', plantId, familyId, type, note });
}

export function getRecords(plantId: string, limit = 10) {
  return callFunction<ICareRecord[]>('care', { action: 'records', plantId, limit });
}

export function getReminders(familyId: string, roomId?: string | null, days = 7) {
  return callFunction<IReminder[]>('care', { action: 'reminders', familyId, roomId, days });
}

export function delayReminder(
  plantId: string,
  familyId: string,
  type: CareType,
  remindAt: string,
) {
  return callFunction('delayed_reminders', {
    action: 'create',
    plantId,
    familyId,
    type,
    remindAt,
  });
}
