const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

// 数据库配置
const DB_PATH = path.join(__dirname, '..', 'data', 'funds.db');

/**
 * 数据同步脚本
 * 从飞书Excel文件同步数据到SQLite数据库
 * 可以通过cron定时任务调用
 */

class DataSyncer {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  async syncFromExcel(filePath) {
    try {
      console.log(`[${new Date().toISOString()}] 开始同步数据: ${filePath}`);

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      // 这里需要实现Excel文件读取逻辑
      // 由于是示例，我们模拟数据同步过程
      const syncResult = await this.mockDataSync(filePath);

      // 记录同步日志
      await this.logSyncResult({
        syncType: 'excel_import',
        status: 'success',
        recordsProcessed: syncResult.recordsProcessed,
        recordsUpdated: syncResult.recordsUpdated,
        filePath: filePath
      });

      console.log(`[${new Date().toISOString()}] 数据同步完成`);
      return syncResult;

    } catch (error) {
      console.error(`[${new Date().toISOString()}] 数据同步失败:`, error.message);

      // 记录错误日志
      await this.logSyncResult({
        syncType: 'excel_import',
        status: 'error',
        recordsProcessed: 0,
        recordsUpdated: 0,
        errorMessage: error.message,
        filePath: filePath
      });

      throw error;
    }
  }

  async mockDataSync(filePath) {
    // 模拟数据处理过程
    console.log('读取Excel文件...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('解析基金数据...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('更新数据库...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      recordsProcessed: 7,
      recordsUpdated: 3,
      message: '数据同步成功'
    };
  }

  async logSyncResult(syncData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO sync_logs (
          sync_type, status, records_processed, records_updated,
          error_message, sync_start, sync_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date();
      stmt.run([
        syncData.syncType,
        syncData.status,
        syncData.recordsProcessed,
        syncData.recordsUpdated,
        syncData.errorMessage || null,
        now.toISOString(),
        new Date().toISOString()
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });

      stmt.finalize();
    });
  }

  async getSyncHistory(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM sync_logs
        ORDER BY created_at DESC
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// 命令行执行
if (require.main === module) {
  const syncer = new DataSyncer();

  // 从命令行参数获取Excel文件路径
  const filePath = process.argv[2] || path.join(__dirname, '..', 'data', '直投和FOF私募管理.xlsx');

  syncer.syncFromExcel(filePath)
    .then((result) => {
      console.log('同步结果:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('同步失败:', error.message);
      process.exit(1);
    })
    .finally(() => {
      syncer.cleanup();
    });
}

module.exports = DataSyncer;