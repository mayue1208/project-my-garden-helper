// 家庭系统云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const DEFAULT_ROOMS = ['客厅', '阳台', '卧室', '书房', '厨房', '卫生间'];

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, familyId, name, inviteCode, memberId } = event;

  // 创建家庭
  if (action === 'create') {
    const code = generateInviteCode();
    const res = await db.collection('families').add({
      data: {
        name,
        inviteCode: code,
        createdBy: OPENID,
        createdAt: db.serverDate(),
      },
    });
    await db.collection('family_members').add({
      data: {
        familyId: res._id,
        userId: OPENID,
        role: 'admin',
        joinedAt: db.serverDate(),
      },
    });
    // 创建默认房间
    const roomsData = DEFAULT_ROOMS.map((roomName, i) => ({
      name: roomName,
      familyId: res._id,
      sortOrder: i,
      isDefault: true,
      createdAt: db.serverDate(),
    }));
    await Promise.all(roomsData.map((r) => db.collection('rooms').add({ data: r })));
    return { code: 0, data: { _id: res._id, name, inviteCode: code } };
  }

  // 通过邀请码加入
  if (action === 'join') {
    const family = await db
      .collection('families')
      .where({ inviteCode })
      .get();
    if (family.data.length === 0) return { code: 1, msg: '邀请码无效' };

    const fid = family.data[0]._id;
    const existing = await db
      .collection('family_members')
      .where({ familyId: fid, userId: OPENID })
      .get();
    if (existing.data.length > 0) return { code: 2, msg: '已在家庭中' };

    await db.collection('family_members').add({
      data: {
        familyId: fid,
        userId: OPENID,
        role: 'member',
        joinedAt: db.serverDate(),
      },
    });
    return { code: 0, data: family.data[0] };
  }

  // 获取用户所有家庭
  if (action === 'list') {
    const members = await db
      .collection('family_members')
      .where({ userId: OPENID })
      .get();
    if (members.data.length === 0) return { code: 0, data: [] };

    const familyIds = members.data.map((m) => m.familyId);
    const families = await db
      .collection('families')
      .where({ _id: _.in(familyIds) })
      .get();

    const result = families.data.map((f) => ({
      ...f,
      role: members.data.find((m) => m.familyId === f._id)?.role,
    }));
    return { code: 0, data: result };
  }

  // 获取家庭成员
  if (action === 'members') {
    const members = await db
      .collection('family_members')
      .where({ familyId })
      .get();
    const userIds = members.data.map((m) => m.userId);
    const users = await db
      .collection('users')
      .where({ _openid: _.in(userIds) })
      .get();

    return {
      code: 0,
      data: members.data.map((m) => ({
        ...m,
        userInfo: users.data.find((u) => u._openid === m.userId),
      })),
    };
  }

  // 获取家庭操作记录
  if (action === 'recentOps') {
    const records = await db
      .collection('care_records')
      .where({ familyId })
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const userIds = [...new Set(records.data.map((r) => r.recordedBy))];
    const users = await db
      .collection('users')
      .where({ _openid: _.in(userIds) })
      .get();

    return {
      code: 0,
      data: records.data.map((r) => ({
        ...r,
        userInfo: users.data.find((u) => u._openid === r.recordedBy),
      })),
    };
  }

  // 获取家庭成员的操作详情（按操作类型分组）
  if (action === 'memberOps') {
    const records = await db
      .collection('care_records')
      .where({ familyId, recordedBy: memberId })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const plantIds = [...new Set(records.data.map((r) => r.plantId))];
    const plants = await db
      .collection('plants')
      .where({ _id: _.in(plantIds) })
      .get();

    // 按 createdAt 分组合并同一次操作
    const groups = {};
    records.data.forEach((r) => {
      const key = r.createdAt;
      if (!groups[key]) groups[key] = { ...r, plants: [] };
      const plant = plants.data.find((p) => p._id === r.plantId);
      if (plant) groups[key].plants.push(plant.name);
    });

    return { code: 0, data: Object.values(groups) };
  }

  // 修改家庭名（仅管理员）
  if (action === 'rename') {
    const member = await db
      .collection('family_members')
      .where({ familyId, userId: OPENID, role: 'admin' })
      .get();
    if (member.data.length === 0) return { code: 2, msg: '无权限' };
    await db.collection('families').doc(familyId).update({ data: { name } });
    return { code: 0 };
  }

  return { code: -1, msg: 'unknown action' };
};
