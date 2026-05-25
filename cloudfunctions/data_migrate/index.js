// 数据迁移云函数 - 为现有的浇水配置添加新字段
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { action } = event;

  if (action === 'migrate-water-configs') {
    try {
      // 查询所有浇水类型的配置
      const waterConfigs = await db
        .collection('care_configs')
        .where({ type: 'water' })
        .get();

      console.log(`找到 ${waterConfigs.data.length} 条浇水配置记录`);

      let migratedCount = 0;
      const now = new Date();

      for (const config of waterConfigs.data) {
        // 检查是否已经存在新字段，避免重复迁移
        if (config.initialIntervalDays === undefined || config.actualIntervalDays === undefined) {
          await db.collection('care_configs').doc(config._id).update({
            data: {
              // 初始间隔设为当前的间隔天数
              initialIntervalDays: config.intervalDays,
              // 实际间隔也设为当前的间隔天数
              actualIntervalDays: config.intervalDays,
              // 设置最后重置日期为当前时间
              lastResetDate: now
            }
          });
          migratedCount++;
          console.log(`已更新配置: ${config._id}`);
        }
      }

      return {
        code: 0,
        msg: `数据迁移完成，共处理 ${migratedCount} 条记录`
      };
    } catch (error) {
      console.error('数据迁移失败:', error);
      return {
        code: -1,
        msg: `数据迁移失败: ${error.message}`
      };
    }
  }

  return { code: -1, msg: '未知操作' };
};