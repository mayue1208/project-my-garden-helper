// 微信登录云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const usersCollection = db.collection('users');

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openId = wxContext.OPENID;

    if (!openId) {
      return { code: -1, msg: '获取微信身份失败' };
    }

    const { nickName, avatarUrl, action } = event;

    // 仅检查登录态，不创建用户
    if (action === 'check') {
      const existing = await usersCollection.where({ _openid: openId }).get();
      if (existing.data.length > 0) {
        return { code: 0, data: existing.data[0] };
      }
      return { code: 1, msg: '未登录' };
    }

    if (action === 'login' || !action) {
      const existing = await usersCollection.where({ _openid: openId }).get();
      if (existing.data.length > 0) {
        const updateData = { lastLogin: db.serverDate() };
        if (nickName) updateData.nickName = nickName;
        if (avatarUrl) updateData.avatarUrl = avatarUrl;
        await usersCollection.doc(existing.data[0]._id).update({ data: updateData });
        return {
          code: 0,
          data: {
            ...existing.data[0],
            nickName: nickName || existing.data[0].nickName,
            avatarUrl: avatarUrl || existing.data[0].avatarUrl,
          },
        };
      }

      const result = await usersCollection.add({
        data: {
          _openid: openId,
          nickName: nickName || '微信用户',
          avatarUrl: avatarUrl || '',
          createdAt: db.serverDate(),
          lastLogin: db.serverDate(),
        },
      });
      return {
        code: 0,
        data: { _id: result._id, _openid: openId, nickName: nickName || '微信用户', avatarUrl: avatarUrl || '' },
      };
    }

    // 更新用户资料（昵称/头像）
    if (action === 'updateProfile') {
      const updateData = {};
      if (nickName) updateData.nickName = nickName;
      if (avatarUrl) updateData.avatarUrl = avatarUrl;
      if (Object.keys(updateData).length === 0) {
        return { code: -1, msg: '没有需要更新的字段' };
      }
      await usersCollection.where({ _openid: openId }).update({ data: updateData });
      return { code: 0, data: { nickName: nickName || '', avatarUrl: avatarUrl || '' } };
    }

    return { code: -1, msg: 'unknown action' };
  } catch (err) {
    return { code: -1, msg: '操作失败: ' + err.message };
  }
};
