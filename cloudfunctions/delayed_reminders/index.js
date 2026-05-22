// 延迟提醒云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, plantId, familyId, type, remindAt } = event;

  if (action === 'create') {
    const existing = await db
      .collection('delayed_reminders')
      .where({ plantId, type, createdBy: OPENID })
      .get();
    if (existing.data.length > 0) {
      await db.collection('delayed_reminders').doc(existing.data[0]._id).update({
        data: { remindAt: new Date(remindAt) },
      });
      return { code: 0 };
    }
    await db.collection('delayed_reminders').add({
      data: {
        plantId,
        familyId,
        type,
        remindAt: new Date(remindAt),
        createdBy: OPENID,
        createdAt: db.serverDate(),
      },
    });
    return { code: 0 };
  }

  if (action === 'cancel') {
    await db
      .collection('delayed_reminders')
      .where({ plantId, type, createdBy: OPENID })
      .remove();
    return { code: 0 };
  }

  return { code: -1, msg: 'unknown action' };
};
