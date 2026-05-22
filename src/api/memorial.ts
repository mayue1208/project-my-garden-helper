import { callFunction } from '@/utils/cloud';
import type { IMemorial, ICreateMemorialData } from '@/interface';

export function getMemorialList(familyId: string) {
  return callFunction<IMemorial[]>('memorial', { action: 'list', familyId });
}

export function createMemorial(plantId: string, familyId: string, data: ICreateMemorialData) {
  return callFunction('memorial', { action: 'create', plantId, familyId, data });
}
