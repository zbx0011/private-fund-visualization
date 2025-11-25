
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/lark-sync.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find the start of the corrupted updateFundMetrics method
const splitIndex = lines.findIndex(line => line.includes('private async updateFundMetrics'));

if (splitIndex !== -1) {
    console.log(`Found updateFundMetrics at line ${splitIndex + 1}. Truncating and fixing...`);

    // Keep everything before updateFundMetrics, but we also want to keep the comment block above it if it exists
    // The comment block is:
    //   /**
    //    * 更新基金指标
    //    */
    // Let's just reconstruct the comment block in our new content to be safe and clean.

    // We'll take lines up to splitIndex. But we should check if the previous lines are the comment block.
    // Actually, let's just cut at splitIndex. If there are comments before, we might duplicate them or leave them.
    // To be cleanest, let's look for the closing brace of the previous method (calculateMetricsForFund).

    let cutIndex = splitIndex;
    // Walk back to find the closing brace of the previous method
    for (let i = splitIndex - 1; i >= 0; i--) {
        if (lines[i].trim() === '}') {
            cutIndex = i + 1;
            break;
        }
    }

    console.log(`Cutting file at line ${cutIndex + 1}`);

    const cleanContent = lines.slice(0, cutIndex).join('\n');

    const newCode = `
  /**
   * 更新基金指标
   */
  private async updateFundMetrics(db: any, fundId: string, metrics: any): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(\`
        UPDATE funds
        SET max_drawdown = ?, sharpe_ratio = ?, volatility = ?, annualized_return = ?
        WHERE name = ?
      \`, [
        metrics.maxDrawdown,
        metrics.sharpeRatio,
        metrics.volatility,
        metrics.annualizedReturn,
        fundId
      ], (err: Error | null) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * 解析净值日期
   */
  private parseNavDate(value: any): string | null {
    if (!value) return null

    if (typeof value === 'number') {
      // 时间戳（毫秒）
      const date = new Date(value)
      // 使用本地时间（假设服务器运行在UTC+8或需要强制UTC+8）
      // 飞书返回的时间戳通常是UTC+8的0点对应的UTC时间
      // 我们需要将其转换为UTC+8的日期字符串
      const offset = 8 * 60 * 60 * 1000 // UTC+8
      const localDate = new Date(date.getTime() + offset)
      return localDate.toISOString().split('T')[0]
    }

    if (typeof value === 'string') {
      return value.split('T')[0]
    }

    return null
  }

  /**
   * 解析数字
   */
  private parseNumber(value: any): number {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const cleaned = value.replace(/[%,¥]/g, '')
      return parseFloat(cleaned) || 0
    }
    return 0
  }
}
`;

    fs.writeFileSync(filePath, cleanContent + '\n' + newCode);
    console.log('File successfully repaired.');

} else {
    console.error('Could not find "private async updateFundMetrics" in the file.');
}
