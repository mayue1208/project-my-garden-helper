// 纪念碑云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, familyId, memorialId, data, plantId } = event;

  if (action === 'list') {
    const res = await db
      .collection('memorials')
      .where({ familyId })
      .orderBy('createdAt', 'desc')
      .get();

    const total = await db
      .collection('plants')
      .where({ familyId, status: _.in(['healthy', 'warning', 'critical']) })
      .count();
    const totalCount = total.total + res.data.length;

    return {
      code: 0,
      data: res.data,
      stats: {
        total: totalCount,
        lost: res.data.length,
        survived: total.total,
      },
    };
  }

  if (action === 'create') {
    const plant = await db.collection('plants').doc(plantId).get();
    await db.collection('memorials').add({
      data: {
        plantId,
        plantName: plant.data.nickname || plant.data.name,
        plantPhoto: plant.data.photo || '',
        familyId,
        type: data.type,
        deathDate: new Date(data.deathDate),
        reason: data.reason || '',
        farewell: data.farewell || '',
        recipient: data.recipient || '',
        memorialPhotos: data.memorialPhotos || [],
        createdBy: OPENID,
        createdAt: db.serverDate(),
      },
    });
    await db.collection('plants').doc(plantId).update({
      data: {
        status: data.type === 'dead' ? 'dead' : 'given',
        updatedAt: db.serverDate(),
      },
    });
    return { code: 0 };
  }

  if (action === 'delete') {
    await db.collection('memorials').doc(memorialId).remove();
    return { code: 0 };
  }

  return { code: -1, msg: 'unknown action' };
};
