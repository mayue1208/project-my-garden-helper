import type { CareType, EventType, MemorialType } from '@/utils/constants';

export interface ICareConfig {
  _id: string;
  plantId: string;
  familyId: string;
  type: CareType;
  intervalDays: number;
  lastTime: Date | null;
  nextTime: Date;
  enabled: boolean;
  createdBy: string;
}

export interface ICareRecord {
  _id: string;
  plantId: string;
  familyId: string;
  type: CareType;
  recordedBy: string;
  note?: string;
  createdAt: Date;
  userName?: string;
}

export interface IReminder {
  plantId: string;
  plantName: string;
  type: CareType;
  nextTime: Date;
  lastTime: Date | null;
  intervalDays: number;
  configId: string;
  isDelayed?: boolean;
}

export interface IGrowthEvent {
  _id: string;
  plantId: string;
  familyId: string;
  type: EventType;
  description?: string;
  photos?: string[];
  eventDate: Date;
  createdBy: string;
  createdAt: Date;
}

export interface IMemorial {
  _id: string;
  plantId: string;
  plantName: string;
  plantPhoto?: string;
  familyId: string;
  type: MemorialType;
  deathDate: Date;
  reason?: string;
  farewell?: string;
  recipient?: string;
  memorialPhotos?: string[];
  createdBy: string;
  createdAt: Date;
}

export interface ICreateMemorialData {
  type: MemorialType;
  deathDate: string;
  reason?: string;
  farewell?: string;
  recipient?: string;
  memorialPhotos?: string[];
}

export interface IDelayedReminder {
  _id: string;
  plantId: string;
  familyId: string;
  type: CareType;
  remindAt: Date;
  createdBy: string;
}
