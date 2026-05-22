// 清空所有数据库集合（一次性使用）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 一次最多删除100条，需要分批删除
async function clearCollection(name) {
  const col = db.collection(name);
  let deleted = 0;
  while (true) {
    const res = await col.where({ _id: _.exists(true) }).limit(100).get();
    if (res.data.length === 0) break;
    const ids = res.data.map((d) => d._id);
    await Promise.all(ids.map((id) => col.doc(id).remove()));
    deleted += ids.length;
  }
  return deleted;
}

const ALL_COLLECTIONS = [
  'users',
  'families',
  'family_members',
  'plants',
  'rooms',
  'care_records',
  'care_configs',
  'growth_events',
  'memorial',
  'delayed_reminders',
];

exports.main = async () => {
  try {
    const results = {};
    for (const name of ALL_COLLECTIONS) {
      results[name] = await clearCollection(name);
    }
    return { code: 0, data: results };
  } catch (err) {
    return { code: -1, msg: '清空失败: ' + err.message };
  }
};
