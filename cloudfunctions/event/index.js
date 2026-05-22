// 成长事件云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, plantId, familyId, eventId, data, limit = 50 } = event;

  if (action === 'list') {
    const query = { plantId };
    if (eventId) query._id = eventId;
    const res = await db
      .collection('growth_events')
      .where(query)
      .orderBy('eventDate', 'desc')
      .limit(limit)
      .get();
    return { code: 0, data: res.data };
  }

  if (action === 'create') {
    await db.collection('growth_events').add({
      data: {
        plantId,
        familyId,
        type: data.type,
        description: data.description || '',
        photos: data.photos || [],
        eventDate: new Date(data.eventDate),
        createdBy: OPENID,
        createdAt: db.serverDate(),
      },
    });
    return { code: 0 };
  }

  if (action === 'delete') {
    await db.collection('growth_events').doc(eventId).remove();
    return { code: 0 };
  }

  return { code: -1, msg: 'unknown action' };
};
