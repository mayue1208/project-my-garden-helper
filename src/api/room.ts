import { callFunction } from '@/utils/cloud';
import type { IRoom } from '@/interface';

export function getRoomList(familyId: string) {
  return callFunction<IRoom[]>('room', { action: 'list', familyId });
}

export function createRoom(familyId: string, name: string, sortOrder = 0) {
  return callFunction<IRoom>('room', { action: 'create', familyId, name, sortOrder });
}

export function renameRoom(roomId: string, name: string) {
  return callFunction('room', { action: 'rename', roomId, name });
}

export function deleteRoom(roomId: string) {
  return callFunction('room', { action: 'delete', roomId });
}
