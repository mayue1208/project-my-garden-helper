import type { PlantStatus } from '@/utils/constants';

export interface IPlant {
  _id: string;
  name: string;
  nickname?: string;
  species?: string;
  roomId: string;
  familyId: string;
  photo?: string;
  purchaseDate?: string;
  status: PlantStatus;
  note?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  recentRecords?: ICareRecord[];
}

export interface ICreatePlantData {
  name: string;
  species?: string;
  nickname?: string;
  photo?: string;
  roomId: string;
  purchaseDate?: string;
  note?: string;
  careConfigs?: { type: string; intervalDays: number }[];
}

export interface IRoom {
  _id: string;
  name: string;
  familyId: string;
  sortOrder: number;
  isDefault: boolean;
}
