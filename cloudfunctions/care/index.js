// 养护记录与提醒云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const {
    action,
    plantId,
    familyId,
    type,
    configId,
    enabled,
    intervalDays,
    limit = 10,
  } = event;

  // 获取养护配置
  if (action === 'getConfigs') {
    const res = await db.collection('care_configs').where({ plantId }).get();
    return { code: 0, data: res.data };
  }

  // 开启/关闭提醒
  if (action === 'toggleConfig') {
    await db.collection('care_configs').doc(configId).update({ data: { enabled } });
    return { code: 0 };
  }

  // 修改间隔
  if (action === 'updateInterval') {
    await db.collection('care_configs').doc(configId).update({
      data: { intervalDays, nextTime: db.serverDate() },
    });
    return { code: 0 };
  }

  // 记录养护操作
  if (action === 'record') {
    await db.collection('care_records').add({
      data: {
        plantId,
        familyId,
        type,
        recordedBy: OPENID,
        note: event.note || '',
        createdAt: db.serverDate(),
      },
    });

    // 只针对浇水操作执行智能间隔逻辑
    if (type === 'water') {
      const config = await db
        .collection('care_configs')
        .where({ plantId, type, enabled: true })
        .get();

      if (config.data.length > 0) {
        const cfg = config.data[0];
        const now = new Date();

        // 检查是否需要重置（超过3个月，即90天）
        const lastReset = cfg.lastResetDate ? new Date(cfg.lastResetDate) : new Date(cfg.createdAt || cfg.updatedAt || now);
        // 使用90天（约3个月）作为重置周期
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;
        const ninetyDaysAgo = new Date(Date.now() - ninetyDays);

        if (lastReset < ninetyDaysAgo) {
          // 超过3个月，重置为初始值
          const newActualInterval = cfg.initialIntervalDays || cfg.intervalDays;

          // 更新配置
          await db.collection('care_configs').doc(cfg._id).update({
            data: {
              lastTime: now,
              nextTime: new Date(now.getTime() + newActualInterval * 86400000),
              actualIntervalDays: newActualInterval,
              lastResetDate: now
            },
          });
        } else {
          // 未超过3个月，应用智能调整逻辑
          let adjustedInterval = cfg.actualIntervalDays || cfg.intervalDays;

          if (cfg.lastTime) {
            // 计算实际间隔天数（从上次浇水到现在）
            const actualDays = Math.round((now.getTime() - new Date(cfg.lastTime).getTime()) / 86400000);

            // 比较与预期的间隔差异
            const expectedInterval = cfg.actualIntervalDays || cfg.intervalDays;
            const difference = actualDays - expectedInterval;

            // 应用调整规则
            if (difference < 0) {
              // 提前浇水，使用实际间隔
              adjustedInterval = actualDays;
            } else {
              // 延迟浇水，增加延迟的天数
              adjustedInterval = expectedInterval + difference;
            }

            // 设置最大和最小间隔限制（例如最小3天，最大30天）
            adjustedInterval = Math.max(3, Math.min(30, adjustedInterval));
          }

          // 更新配置
          await db.collection('care_configs').doc(cfg._id).update({
            data: {
              lastTime: now,
              nextTime: new Date(now.getTime() + adjustedInterval * 86400000),
              actualIntervalDays: adjustedInterval
            },
          });
        }
      }
    } else {
      // 非浇水操作，使用原有逻辑
      const config = await db
        .collection('care_configs')
        .where({ plantId, type, enabled: true })
        .get();
      if (config.data.length > 0) {
        const cfg = config.data[0];
        const now = new Date();
        const nextTime = new Date(now.getTime() + cfg.intervalDays * 86400000);
        await db.collection('care_configs').doc(cfg._id).update({
          data: { lastTime: now, nextTime },
        });
      }
    }

    // 删除对应的延迟提醒
    await db
      .collection('delayed_reminders')
      .where({ plantId, type, createdBy: OPENID })
      .remove();
    return { code: 0 };
  }

  // 获取养护记录列表
  if (action === 'records') {
    const query = {};
    if (plantId) query.plantId = plantId;
    if (familyId) query.familyId = familyId;
    const res = await db
      .collection('care_records')
      .where(query)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const userIds = [...new Set(res.data.map((r) => r.recordedBy))];
    const users =
      userIds.length > 0
        ? await db.collection('users').where({ _openid: _.in(userIds) }).get()
        : { data: [] };

    return {
      code: 0,
      data: res.data.map((r) => ({
        ...r,
        userName: users.data.find((u) => u._openid === r.recordedBy)?.nickName || '',
      })),
    };
  }

  // 获取提醒列表（今日/7天）
  if (action === 'reminders') {
    const { roomId, days = 7 } = event;
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 86400000);

    const configQuery = {
      familyId,
      enabled: true,
      nextTime: _.lte(endDate),
    };
    const configs = await db.collection('care_configs').where(configQuery).get();

    let plantIds = configs.data.map((c) => c.plantId);
    const plantQuery = {
      _id: _.in(plantIds),
      familyId,
      status: _.in(['healthy', 'warning', 'critical']),
    };
    if (roomId) plantQuery.roomId = roomId;
    const plants = await db.collection('plants').where(plantQuery).get();
    const validPlantIds = new Set(plants.data.map((p) => p._id));

    const reminders = configs.data
      .filter((c) => validPlantIds.has(c.plantId))
      .map((c) => {
        const plant = plants.data.find((p) => p._id === c.plantId);
        return {
          plantId: c.plantId,
          plantName: plant?.nickname || plant?.name || '',
          type: c.type,
          nextTime: c.nextTime,
          lastTime: c.lastTime,
          intervalDays: c.intervalDays,
          configId: c._id,
        };
      });

    const delayed = await db
      .collection('delayed_reminders')
      .where({
        plantId: _.in([...validPlantIds]),
        remindAt: _.lte(endDate),
        familyId,
      })
      .get();

    const delayedMap = {};
    delayed.data.forEach((d) => {
      delayedMap[`${d.plantId}_${d.type}`] = d;
    });

    const merged = reminders.map((r) => {
      const key = `${r.plantId}_${r.type}`;
      if (delayedMap[key]) {
        return { ...r, nextTime: delayedMap[key].remindAt, isDelayed: true };
      }
      return r;
    });

    return { code: 0, data: merged };
  }

  return { code: -1, msg: 'unknown action' };
};
