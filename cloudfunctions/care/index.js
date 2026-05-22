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
