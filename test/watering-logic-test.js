/**
 * 智能浇水提醒逻辑测试脚本
 *
 * 用于验证算法逻辑的正确性
 */

// 测试智能调整算法
function calculateNextInterval(currentInterval, lastWaterDay, actualWaterDay, expectedWaterDay) {
  // 计算实际间隔（从上次浇水到本次浇水）
  const actualInterval = actualWaterDay - lastWaterDay;

  // 计算与预期的差异
  const difference = actualWaterDay - expectedWaterDay;

  let newInterval;
  if (difference < 0) {
    // 提前浇水，使用实际间隔
    newInterval = actualInterval;
  } else {
    // 延迟浇水，增加延迟的天数
    newInterval = currentInterval + difference;
  }

  // 限制在合理范围内（3-30天）
  newInterval = Math.max(3, Math.min(30, newInterval));

  return newInterval;
}

// 测试场景1：提前浇水
console.log("=== 测试场景1：提前浇水 ===");
let lastWaterDay = 0;  // 第0天浇水
let expectedWaterDay = 5;  // 预期第5天浇水
let actualWaterDay = 4;  // 实际第4天浇水（提前1天）
let currentInterval = 5;  // 当前间隔为5天

let nextInterval = calculateNextInterval(currentInterval, lastWaterDay, actualWaterDay, expectedWaterDay);
console.log(`上次浇水: 第${lastWaterDay}天`);
console.log(`预期浇水: 第${expectedWaterDay}天`);
console.log(`实际浇水: 第${actualWaterDay}天`);
console.log(`当前间隔: ${currentInterval}天`);
console.log(`下次间隔: ${nextInterval}天`);
console.log("");

// 测试场景2：延迟浇水
console.log("=== 测试场景2：延迟浇水 ===");
lastWaterDay = 5;  // 第5天浇水
expectedWaterDay = 10;  // 预期第10天浇水
actualWaterDay = 12;  // 实际第12天浇水（延迟2天）
currentInterval = 5;  // 当前间隔为5天

nextInterval = calculateNextInterval(currentInterval, lastWaterDay, actualWaterDay, expectedWaterDay);
console.log(`上次浇水: 第${lastWaterDay}天`);
console.log(`预期浇水: 第${expectedWaterDay}天`);
console.log(`实际浇水: 第${actualWaterDay}天`);
console.log(`当前间隔: ${currentInterval}天`);
console.log(`下次间隔: ${nextInterval}天`);
console.log("");

// 测试场景3：多次调整
console.log("=== 测试场景3：连续调整 ===");
let day = 0;
let interval = 5;
let lastDay = 0;

for (let i = 0; i < 5; i++) {
  let expected = lastDay + interval;
  // 模拟每次都提前1天浇水
  let actual = expected - 1;

  console.log(`第${i+1}次浇水: 预期第${expected}天，实际第${actual}天`);

  interval = calculateNextInterval(interval, lastDay, actual, expected);
  console.log(`  -> 间隔调整为: ${interval}天`);

  lastDay = actual;
  day = actual;
}