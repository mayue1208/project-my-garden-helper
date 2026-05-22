// 房间管理云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, familyId, roomId, name, sortOrder } = event;

  if (action === 'list') {
    const res = await db
      .collection('rooms')
      .where({ familyId })
      .orderBy('sortOrder', 'asc')
      .get();
    return { code: 0, data: res.data };
  }

  if (action === 'create') {
    const res = await db.collection('rooms').add({
      data: {
        name,
        familyId,
        sortOrder: sortOrder || 0,
        isDefault: false,
        createdAt: db.serverDate(),
      },
    });
    return { code: 0, data: { _id: res._id, name } };
  }

  if (action === 'rename') {
    await db.collection('rooms').doc(roomId).update({ data: { name } });
    return { code: 0 };
  }

  if (action === 'delete') {
    await db.collection('rooms').doc(roomId).remove();
    // 将该房间的植物移至未分类
    await db.collection('plants').where({ roomId }).update({
      data: { roomId: '' },
    });
    return { code: 0 };
  }

  return { code: -1, msg: 'unknown action' };
};
