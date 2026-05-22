// 植物 CRUD 云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
  const { OPENID } = cloud.getWXContext();
  const { action, familyId, plantId, data } = event;

  if (action === 'list') {
    const { roomId, page = 1, pageSize = 10 } = event;
    const query = { familyId };
    if (roomId) query.roomId = roomId;
    query.status = _.in(['healthy', 'warning', 'critical']);

    const totalRes = await db.collection('plants').where(query).count();
    const total = totalRes.total;

    const res = await db
      .collection('plants')
      .where(query)
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    const plants = res.data;
    const plantIds = plants.map((p) => p._id);

    let records = { data: [] };
    if (plantIds.length > 0) {
      records = await db
        .collection('care_records')
        .where({ plantId: _.in(plantIds), familyId })
        .orderBy('createdAt', 'desc')
        .get();
    }

    const result = plants.map((p) => ({
      ...p,
      recentRecords: records.data.filter((r) => r.plantId === p._id).slice(0, 3),
    }));
    return { code: 0, data: result, hasMore: page * pageSize < total, total };
  }

  if (action === 'get') {
    const res = await db.collection('plants').doc(plantId).get();
    return { code: 0, data: res.data };
  }

  if (action === 'create') {
    try {
      const { careConfigs, ...plantData } = data || {};
      const res = await db.collection('plants').add({
        data: {
          ...plantData,
          familyId,
          createdBy: OPENID,
          status: 'healthy',
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
        },
      });
      if (careConfigs && careConfigs.length > 0) {
        const now = new Date();
        const configs = careConfigs.map((c) => {
          const isWater = c.type === 'water';
          return {
            plantId: res._id,
            familyId,
            type: c.type,
            intervalDays: c.intervalDays,
            lastTime: isWater ? now : null,
            nextTime: isWater ? new Date(now.getTime() + c.intervalDays * 86400000) : db.serverDate(),
            enabled: true,
            createdBy: OPENID,
          };
        });
        await Promise.all(configs.map((c) => db.collection('care_configs').add({ data: c })));
        const waterCfg = careConfigs.find((c) => c.type === 'water');
        if (waterCfg) {
          await db.collection('care_records').add({
            data: {
              plantId: res._id,
              familyId,
              type: 'water',
              recordedBy: OPENID,
              note: '首次添加，默认已浇水',
              createdAt: db.serverDate(),
            },
          });
        }
      }
      return { code: 0, data: { _id: res._id } };
    } catch (err) {
      return { code: -1, msg: err.message || '创建植物失败' };
    }
  }

  if (action === 'update') {
    const { careConfigs, ...plantData } = data || {};
    await db
      .collection('plants')
      .doc(plantId)
      .update({ data: { ...plantData, updatedAt: db.serverDate() } });
    if (careConfigs) {
      await db.collection('care_configs').where({ plantId }).remove();
      if (careConfigs.length > 0) {
        const configs = careConfigs.map((c) => ({
          plantId,
          familyId,
          type: c.type,
          intervalDays: c.intervalDays,
          lastTime: null,
          nextTime: db.serverDate(),
          enabled: true,
          createdBy: OPENID,
        }));
        await Promise.all(configs.map((c) => db.collection('care_configs').add({ data: c })));
      }
    }
    return { code: 0 };
  }

  if (action === 'delete') {
    await db.collection('plants').doc(plantId).remove();
    await db.collection('care_configs').where({ plantId }).remove();
    await db.collection('care_records').where({ plantId }).remove();
    await db.collection('growth_events').where({ plantId }).remove();
    await db.collection('delayed_reminders').where({ plantId }).remove();
    return { code: 0 };
  }

  return { code: -1, msg: 'unknown action' };
  } catch (err) {
    return { code: -1, msg: '[plant] ' + (err.message || err.errMsg || 'unknown error') };
  }
};
