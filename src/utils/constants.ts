// ===== 植物状态 =====
export type PlantStatus = 'healthy' | 'warning' | 'critical' | 'dead' | 'given';

export const PLANT_STATUS_LABEL: Record<PlantStatus, string> = {
  healthy: '健康',
  warning: '需关注',
  critical: '病危',
  dead: '已故',
  given: '已赠出',
};

// ===== 养护操作类型 =====
export type CareType = 'water' | 'fertilize' | 'prune' | 'repot' | 'pesticide';

export const CARE_TYPES: CareType[] = [
  'water',
  'fertilize',
  'prune',
  'repot',
  'pesticide',
];

export const CARE_TYPE_LABEL: Record<CareType, string> = {
  water: '浇水',
  fertilize: '施肥',
  prune: '修剪',
  repot: '换盆',
  pesticide: '杀虫',
};

export const CARE_TYPE_ICON: Record<CareType, string> = {
  water: '💧',
  fertilize: '🌿',
  prune: '✂️',
  repot: '🪴',
  pesticide: '🐛',
};

// ===== 成长事件类型 =====
export type EventType = 'repot' | 'prune' | 'pest' | 'bloom' | 'propagate' | 'other';

export const EVENT_TYPES: EventType[] = ['repot', 'prune', 'pest', 'bloom', 'propagate', 'other'];

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  repot: '换盆',
  prune: '修剪',
  pest: '长虫',
  bloom: '开花',
  propagate: '繁殖',
  other: '其他',
};

// ===== 家庭成员角色 =====
export type MemberRole = 'admin' | 'member';

// ===== 纪念碑类型 =====
export type MemorialType = 'dead' | 'given';

// ===== 预置房间 =====
export const DEFAULT_ROOMS = ['客厅', '阳台', '卧室', '书房', '厨房', '卫生间'];

// ===== 延后提醒选项 =====
export interface DelayOption {
  label: string;
  getTime: () => number;
}

export const DELAY_OPTIONS: DelayOption[] = [
  { label: '1小时后', getTime: () => Date.now() + 3600000 },
  {
    label: '今晚 18:00',
    getTime: () => {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      return d.getTime();
    },
  },
  { label: '明天', getTime: () => Date.now() + 86400000 },
  { label: '后天', getTime: () => Date.now() + 172800000 },
  { label: '一周后', getTime: () => Date.now() + 604800000 },
  { label: '一个月后', getTime: () => Date.now() + 2592000000 },
  { label: '两个月后', getTime: () => Date.now() + 5184000000 },
];

// ===== 默认养护间隔 =====
export const DEFAULT_CARE_INTERVALS: Record<string, number> = {
  water: 7,
  fertilize: 30,
  prune: 60,
  repot: 90,
  pesticide: 60,
};
