"use strict";
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${h}:${min}`;
}
function isToday(date) {
  const d = new Date(date);
  const now = /* @__PURE__ */ new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
function isOverdue(date) {
  return new Date(date) < /* @__PURE__ */ new Date();
}
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.isOverdue = isOverdue;
exports.isToday = isToday;
