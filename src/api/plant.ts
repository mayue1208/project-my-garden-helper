import { callFunction } from '@/utils/cloud';
import type { IPlant, IRoom, ICreatePlantData } from '@/interface';

export function getPlantList(familyId: string, roomId?: string) {
  return callFunction<IPlant[]>('plant', { action: 'list', familyId, roomId });
}

export function getPlantDetail(plantId: string) {
  return callFunction<IPlant>('plant', { action: 'get', plantId });
}

export function createPlant(familyId: string, data: ICreatePlantData) {
  return callFunction<{ _id: string }>('plant', { action: 'create', familyId, data });
}

export function updatePlant(plantId: string, data: Partial<ICreatePlantData>) {
  return callFunction('plant', { action: 'update', plantId, data });
}

export function deletePlant(plantId: string) {
  return callFunction('plant', { action: 'delete', plantId });
}

export function getRoomList(familyId: string) {
  return callFunction<IRoom[]>('room', { action: 'list', familyId });
}

export function createRoom(familyId: string, name: string) {
  return callFunction<IRoom>('room', { action: 'create', familyId, name });
}

export function renameRoom(roomId: string, name: string) {
  return callFunction('room', { action: 'rename', roomId, name });
}

export function deleteRoom(roomId: string) {
  return callFunction('room', { action: 'delete', roomId });
}
