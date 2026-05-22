"use strict";
const PLANT_STATUS_LABEL = {
  healthy: "健康",
  warning: "需关注",
  critical: "病危",
  dead: "已故",
  given: "已赠出"
};
const CARE_TYPES = [
  "water",
  "fertilize",
  "prune",
  "repot",
  "pesticide"
];
const CARE_TYPE_LABEL = {
  water: "浇水",
  fertilize: "施肥",
  prune: "修剪",
  repot: "换盆",
  pesticide: "杀虫"
};
const CARE_TYPE_ICON = {
  water: "💧",
  fertilize: "🌿",
  prune: "✂️",
  repot: "🪴",
  pesticide: "🐛"
};
const EVENT_TYPES = ["repot", "prune", "pest", "bloom", "propagate", "other"];
const EVENT_TYPE_LABEL = {
  repot: "换盆",
  prune: "修剪",
  pest: "长虫",
  bloom: "开花",
  propagate: "繁殖",
  other: "其他"
};
const DELAY_OPTIONS = [
  { label: "1小时后", getTime: () => Date.now() + 36e5 },
  {
    label: "今晚 18:00",
    getTime: () => {
      const d = /* @__PURE__ */ new Date();
      d.setHours(18, 0, 0, 0);
      return d.getTime();
    }
  },
  { label: "明天", getTime: () => Date.now() + 864e5 },
  { label: "后天", getTime: () => Date.now() + 1728e5 },
  { label: "一周后", getTime: () => Date.now() + 6048e5 },
  { label: "一个月后", getTime: () => Date.now() + 2592e6 },
  { label: "两个月后", getTime: () => Date.now() + 5184e6 }
];
const DEFAULT_CARE_INTERVALS = {
  water: 7,
  fertilize: 30,
  prune: 60,
  repot: 90,
  pesticide: 60
};
exports.CARE_TYPES = CARE_TYPES;
exports.CARE_TYPE_ICON = CARE_TYPE_ICON;
exports.CARE_TYPE_LABEL = CARE_TYPE_LABEL;
exports.DEFAULT_CARE_INTERVALS = DEFAULT_CARE_INTERVALS;
exports.DELAY_OPTIONS = DELAY_OPTIONS;
exports.EVENT_TYPES = EVENT_TYPES;
exports.EVENT_TYPE_LABEL = EVENT_TYPE_LABEL;
exports.PLANT_STATUS_LABEL = PLANT_STATUS_LABEL;
