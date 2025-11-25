import { BitableRecord } from './lark-api'
import { LarkBitableAPI } from './lark-api'

interface FundData {
  id: string
  name: string
  strategy: string
  manager: string
  latestNavDate: Date
  cumulativeReturn: number
  annualizedReturn: number
  maxDrawdown: number
  sharpeRatio: number
  volatility: number
  totalAssets: number
  standingAssets: number
  cashAllocation: number
  status: string
  establishmentDate?: Date
  cost?: number
  scale?: number
  weeklyReturn?: number
  dailyReturn?: number
  dailyPnl?: number
  yearlyReturn?: number
  concentration?: number
  dailyCapitalUsage?: number
  weeklyPnl?: number
  yearlyPnl?: number
}

interface FieldMapping {
  [key: string]: string // 字段名 -> 数据属性名
}

export class DataConverter {
  // 默认字段映射配置
  private static fieldMapping: FieldMapping = {
    '产品名称': 'name',
    '基金名称': 'name',
    '投资策略': 'strategy',
    '策略': 'strategy',
    '策略类型': 'strategy',
    '投资经理': 'manager',
    '经理': 'manager',
    '最新净值日期': 'latestNavDate',
    '净值日期': 'latestNavDate',
    '累计收益率': 'cumulativeReturn',
    '累计盈亏率': 'cumulativeReturn',
    '收益率': 'cumulativeReturn',
    // '本年收益率': 'annualizedReturn', // Moved to bottom
    '年化收益率': 'annualizedReturn',
    '最大回撤': 'maxDrawdown',
    '夏普比率': 'sharpeRatio',
    '波动率': 'volatility',
    '总规模': 'totalAssets',
    '规模': 'totalAssets',
    '总份额': 'totalAssets',
    '存续规模': 'standingAssets',
    '站岗资金': 'cashAllocation',
    '站岗资金占用': 'cashAllocation',
    // '日均资金占用': 'cost', // Removed: Cost should come from '成本' field in specific table
    '集中度': 'concentration',
    '状态': 'status',
    '成立日期': 'establishmentDate',
    '成本': 'cost',
    '当前规模': 'scale',
    '本周收益率': 'weeklyReturn',
    '周收益率': 'weeklyReturn',
    '本周盈亏率': 'weeklyReturn',
    '日收益率': 'dailyReturn',
    '日盈亏率': 'dailyReturn',
    '日收益': 'dailyReturn',
    '本日盈亏': 'dailyPnl', // 修正：本日盈亏对应dailyPnl (金额)
    '当日盈亏': 'dailyPnl',
    '日收益额': 'dailyPnl',
    '持有成本': 'cost',
    '投资成本': 'cost',
    '本年收益率': 'yearlyReturn' // 修正：本年收益率对应yearlyReturn
  }

  // 策略类型选项ID的临时映射（基于已知的选项）
  private static strategyOptionMapping: Record<string, string> = {
    'opteZ8clPp': '指增',
    'optAf8gJwT': '指增',
    'optBf2hKwU': 'CTA',
    'optCg3lLxV': '量选',
    'optDh4mMyW': '宏观',
    'optEi5nNzX': '套利',
    'optFj6oOaY': '债券',
    'optGk7pPbZ': '混合',
    'optHl8qQcA': '管理期货',
    'optvE8Axra': '中性',
    'optztNchXY': '可转债',  // 修正：优美利金安长牛2号 -> 可转债
    'optA6mwCSf': '量选',  // 修正：大道萑苇 -> 量选
    'optN5SM1ew': 'T0',
    'optMJZQ4p5': '混合',
    'optpdOvS5N': 'CTA',
    'optcXUA9c6': '套利',
    'optHhPUvUQ': '择时对冲', // 修正：赫富灵活对冲一号 -> 择时对冲
    'optC7xvukD': '期权',
    'optTiming': '择时'
  }

  /**
   * 创建选项ID到名称的映射
   */
  static async createOptionMapping(appToken: string, tableId: string): Promise<Record<string, Record<string, string>>> {
    try {
      const api = new LarkBitableAPI({
        appId: process.env.LARK_APP_ID!,
        appSecret: process.env.LARK_APP_SECRET!
      })

      const fields = await api.getBitableFields(appToken, tableId)
      const optionMappings: Record<string, Record<string, string>> = {}

      console.log('获取到的字段数量:', fields.length)

      for (const field of fields) {
        console.log(`字段: ${field.field_name}, 类型: ${field.type}, UI类型: ${field.ui_type}`)

        if (field.type === 3 || field.ui_type === 'SingleSelect' || field.ui_type === 'MultiSelect') {
          const mapping: Record<string, string> = {}
          console.log(`选项字段 ${field.field_name} 的选项:`, field.property?.options)
          if (field.property && field.property.options) {
            for (const option of field.property.options) {
              mapping[option.name] = option.name
              // 也为可能的选项ID创建映射
              if (option.option_id) {
                mapping[option.option_id] = option.name
                console.log(`映射: ${option.option_id} -> ${option.name}`)
              }
              // 也为选项的其他可能ID格式创建映射
              if (option.id) {
                mapping[option.id] = option.name
                console.log(`映射ID: ${option.id} -> ${option.name}`)
              }
            }
          }
          optionMappings[field.field_name] = mapping
          console.log(`字段 ${field.field_name} 的映射:`, optionMappings[field.field_name])
        }

        // 查找字段暂时跳过，使用静态映射处理策略类型
        // TODO: 后续可以优化查找字段的动态选项获取
      }

      console.log('最终选项映射:', optionMappings)
      return optionMappings
    } catch (error) {
      console.warn('创建选项映射失败:', error)
      return {}
    }
  }

  /**
   * 转换飞书多维表格数据为基金数据（支持选项转换）
   */
  static async convertBitableToFundDataWithOptions(
    records: BitableRecord[],
    appToken: string,
    tableId: string,
    customMapping?: FieldMapping
  ): Promise<FundData[]> {
    // 创建选项映射
    const optionMappings = await this.createOptionMapping(appToken, tableId)

    // 根据表格ID定义特定映射
    let tableSpecificMapping: FieldMapping = {}

    if (tableId === 'tblXwpq4lQzfymME') { // 第一创业FOF
      tableSpecificMapping = {
        '基金名称': 'name',
        '净值日期': 'latestNavDate',
        '资产净值': 'totalAssets',
        '成本': 'cost',
        '持有份额': 'scale'
      }
    } else if (tableId === 'tblcXqDbfgA0x533') { // 私募取数表
      tableSpecificMapping = {
        '基金名称': 'name',
        // '当日盈亏': 'dailyPnl',      // REMOVED: 这个字段是公式计算，值不准确
        // '本日盈亏': 'dailyPnl',      // REMOVED: 应该使用私募盈亏一览表的数据
        '本年收益率': 'yearlyReturn',    // 本年收益率 (Yearly Return)
        '本周收益率': 'weeklyReturn',    // 本周收益率 (Weekly Return)
        '集中度': 'concentration',       // 集中度 (Concentration) - from formula or import
        '投资成本': 'cost',            // 成本 (Cost)
        '成本': 'cost',                // Alternative field name
        '资产净值': 'totalAssets',
        '状态': 'status',              // 状态 (Status)
        '策略': 'strategy',            // 策略
        '投资经理': 'manager',         // 投资经理
        '净值日期': 'latestNavDate'
      }
    } else if (tableId === 'tblcK2mWFtgob3Dg') { // 私募盈亏一览表  
      tableSpecificMapping = {
        '基金名称': 'name',      // For matching
        '集中度': 'concentration', // Only extract concentration from this table
        '日均资金占用': 'dailyCapitalUsage', // Added
        '本周收益': 'weeklyPnl', // Added
        '本年收益': 'yearlyPnl', // Added
        '本日盈亏': 'dailyPnl' // Added: 这才是正确的日盈亏数据源
      }
    }

    const finalMapping = { ...customMapping, ...tableSpecificMapping }

    // 使用带有选项转换的转换方法
    const data = this.convertBitableToFundData(records, finalMapping, optionMappings)

    // 对FOF表进行特殊处理（设置默认值）
    if (tableId === 'tblXwpq4lQzfymME') {
      data.forEach(item => {
        if (!item.strategy) item.strategy = 'FOF'
        if (!item.manager) item.manager = '第一创业'
      })
    }

    return data
  }

  /**
   * 转换飞书多维表格数据为基金数据
   */
  static convertBitableToFundData(
    records: BitableRecord[],
    customMapping?: FieldMapping,
    optionMappings?: Record<string, Record<string, string>>
  ): FundData[] {
    const mapping = { ...this.fieldMapping, ...customMapping }
    const convertedData: FundData[] = []

    for (const record of records) {
      try {
        const fundData: FundData = {
          id: record.record_id,
          name: this.getFieldValue(record.fields, 'name', mapping, optionMappings) || '',
          strategy: this.getFieldValue(record.fields, 'strategy', mapping, optionMappings) || '',
          manager: this.getFieldValue(record.fields, 'manager', mapping, optionMappings) || '',
          latestNavDate: this.parseDate(this.getFieldValue(record.fields, 'latestNavDate', mapping, optionMappings)),
          cumulativeReturn: this.parseNumber(this.getFieldValue(record.fields, 'cumulativeReturn', mapping, optionMappings)),
          annualizedReturn: this.parseNumber(this.getFieldValue(record.fields, 'annualizedReturn', mapping, optionMappings)),
          maxDrawdown: this.parseNumber(this.getFieldValue(record.fields, 'maxDrawdown', mapping, optionMappings)),
          sharpeRatio: this.parseNumber(this.getFieldValue(record.fields, 'sharpeRatio', mapping, optionMappings)),
          volatility: this.parseNumber(this.getFieldValue(record.fields, 'volatility', mapping, optionMappings)),
          totalAssets: this.parseCurrency(this.getFieldValue(record.fields, 'totalAssets', mapping, optionMappings)),
          standingAssets: this.parseCurrency(this.getFieldValue(record.fields, 'standingAssets', mapping, optionMappings)),
          cashAllocation: this.parseCurrency(this.getFieldValue(record.fields, 'cashAllocation', mapping, optionMappings)),
          concentration: this.parseNumber(this.getFieldValue(record.fields, 'concentration', mapping, optionMappings)),
          status: this.getFieldValue(record.fields, 'status', mapping, optionMappings) || '申购中'
        }

        // 可选字段
        const establishmentDate = this.getFieldValue(record.fields, 'establishmentDate', mapping, optionMappings)
        if (establishmentDate) {
          fundData.establishmentDate = this.parseDate(establishmentDate)
        }

        const cost = this.getFieldValue(record.fields, 'cost', mapping, optionMappings)
        if (cost !== null && cost !== undefined) {
          fundData.cost = this.parseCurrency(cost)
        }

        const scale = this.getFieldValue(record.fields, 'scale', mapping, optionMappings)
        if (scale !== null && scale !== undefined) {
          fundData.scale = this.parseCurrency(scale)
        }

        const weeklyReturn = this.getFieldValue(record.fields, 'weeklyReturn', mapping, optionMappings)
        if (weeklyReturn !== null && weeklyReturn !== undefined) {
          fundData.weeklyReturn = this.parseNumber(weeklyReturn)
        }

        const dailyReturn = this.getFieldValue(record.fields, 'dailyReturn', mapping, optionMappings)
        if (dailyReturn !== null && dailyReturn !== undefined) {
          fundData.dailyReturn = this.parseNumber(dailyReturn)
        }

        const dailyPnl = this.getFieldValue(record.fields, 'dailyPnl', mapping, optionMappings)
        if (dailyPnl !== null && dailyPnl !== undefined) {
          fundData.dailyPnl = this.parseCurrency(dailyPnl)
        }

        const yearlyReturn = this.getFieldValue(record.fields, 'yearlyReturn', mapping, optionMappings)
        if (yearlyReturn !== null && yearlyReturn !== undefined) {
          fundData.yearlyReturn = this.parseNumber(yearlyReturn)
        }

        const dailyCapitalUsage = this.getFieldValue(record.fields, 'dailyCapitalUsage', mapping, optionMappings)
        if (dailyCapitalUsage !== null && dailyCapitalUsage !== undefined) {
          fundData.dailyCapitalUsage = this.parseCurrency(dailyCapitalUsage)
        }

        const weeklyPnl = this.getFieldValue(record.fields, 'weeklyPnl', mapping, optionMappings)
        if (weeklyPnl !== null && weeklyPnl !== undefined) {
          fundData.weeklyPnl = this.parseCurrency(weeklyPnl)
        }

        const yearlyPnl = this.getFieldValue(record.fields, 'yearlyPnl', mapping, optionMappings)
        if (yearlyPnl !== null && yearlyPnl !== undefined) {
          fundData.yearlyPnl = this.parseCurrency(yearlyPnl)
        }

        // 调试信息
        if (record.record_id === 'recuUuIP4mWMQn') {
          console.log('=== 调试第一条记录转换 ===')
          console.log('原始字段:', Object.keys(record.fields))
          console.log('投资经理原始值:', JSON.stringify(record.fields['投资经理']))
          console.log('本周收益率原始值:', JSON.stringify(record.fields['本周收益率']))
          console.log('本年收益率原始值:', JSON.stringify(record.fields['本年收益率']))
          console.log('本日盈亏原始值:', JSON.stringify(record.fields['本日盈亏']))
          console.log('转换结果:')
          console.log('- manager:', fundData.manager)
          console.log('- weeklyReturn:', fundData.weeklyReturn)
          console.log('- annualizedReturn:', fundData.annualizedReturn)
          console.log('- dailyReturn:', fundData.dailyReturn)
          console.log('- cost:', fundData.cost)
        }

        convertedData.push(fundData)
      } catch (error) {
        console.warn(`转换记录失败 ${record.record_id}:`, error)
      }
    }

    return convertedData
  }

  /**
   * 转换飞书多维表格数据为基金数据（向后兼容）
   */
  static convertBitableToFundDataLegacy(records: BitableRecord[], customMapping?: FieldMapping): FundData[] {
    return this.convertBitableToFundData(records, customMapping)
  }

  /**
   * 获取字段值
   */
  private static getFieldValue(
    fields: Record<string, any>,
    targetKey: string,
    mapping: FieldMapping,
    optionMappings?: Record<string, Record<string, string>>
  ): any {
    // 查找映射的字段名
    for (const [sourceKey, mappedKey] of Object.entries(mapping)) {
      if (mappedKey === targetKey && fields[sourceKey] !== undefined) {
        const value = fields[sourceKey]

        // 特殊处理策略和状态字段
        if (targetKey === 'strategy' || targetKey === 'status') {
          // For status field, if value is undefined, return null to allow default value
          if (targetKey === 'status' && (value === undefined || value === null)) {
            return null
          }

          const extractedValue = this.extractTextValue(value)

          // For status field, apply hardcoded mapping for option IDs
          if (targetKey === 'status') {
            const STATUS_ID_MAP: Record<string, string> = {
              'optFl1SLci': '已赎回',  // Option ID for "已赎回" (Redeemed)
              '已赎回': '已赎回'       // Direct text value
            };

            if (STATUS_ID_MAP[extractedValue]) {
              return STATUS_ID_MAP[extractedValue];
            }
          }

          // 首先尝试使用动态选项映射
          if (optionMappings) {
            const fieldMapping = optionMappings[sourceKey]
            if (fieldMapping && fieldMapping[extractedValue]) {
              return fieldMapping[extractedValue]
            }
          }

          // 对于策略字段，使用临时映射
          if (targetKey === 'strategy' && this.strategyOptionMapping[extractedValue]) {
            console.log(`Mapping strategy ID ${extractedValue} to ${this.strategyOptionMapping[extractedValue]}`);
            return this.strategyOptionMapping[extractedValue]
          }

          return extractedValue
        }

        // 对于投资经理字段，尝试使用选项映射或硬编码映射
        if (targetKey === 'manager') {
          const extractedValue = this.extractTextValue(value)

          // 1. 尝试硬编码映射 (修复找不到源表的问题)
          const MANAGER_ID_MAP: Record<string, string> = {
            'optJU6D40q': '张鹏',
            'optjyy9D9f': '彭思宇'
          };

          if (MANAGER_ID_MAP[extractedValue]) {
            return MANAGER_ID_MAP[extractedValue];
          }

          // 2. 尝试动态选项映射
          if (optionMappings) {
            const fieldMapping = optionMappings[sourceKey]
            if (fieldMapping && fieldMapping[extractedValue]) {
              return fieldMapping[extractedValue]
            }
          }

          return extractedValue
        }

        return value
      }
    }
    return null
  }

  /**
   * 从复杂结构中提取文本值
   */
  private static extractTextValue(value: any): string {
    if (value === null || value === undefined) {
      return '未知'
    }

    if (typeof value === 'string') {
      return value
    }

    // 处理飞书新格式: {type: 3, value: ["T0"]}
    if (typeof value === 'object' && !Array.isArray(value)) {
      // 检查是否有value属性
      if (value.value !== undefined) {
        // 递归处理value
        return this.extractTextValue(value.value)
      }
      // 如果是对象且有text属性
      if (value.text) {
        return value.text
      }
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '未知'
      }

      // 如果数组中的元素是对象且有text属性
      const firstItem = value[0]
      if (firstItem && typeof firstItem === 'object' && firstItem.text) {
        return firstItem.text
      }

      // 如果数组中的元素是字符串
      if (typeof firstItem === 'string') {
        return firstItem
      }

      // 默认返回对象的字符串表示
      return String(firstItem)
    }

    return String(value)
  }

  /**
   * 解析数字
   */
  private static parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0
    }

    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'string') {
      // 移除百分号并转换
      const cleanValue = value.toString().replace(/[%,¥]/g, '').trim()
      const parsed = parseFloat(cleanValue)
      return isNaN(parsed) ? 0 : parsed
    }

    // 处理飞书公式字段格式: {type: 2, value: [number]}
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.value !== undefined) {
        // 递归处理 value 属性
        return this.parseNumber(value.value)
      }
    }

    if (Array.isArray(value) && value.length > 0) {
      // 如果是数组，取第一个元素
      return this.parseNumber(value[0])
    }

    return 0
  }

  /**
   * 解析货币值
   */
  private static parseCurrency(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0
    }

    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'string') {
      // 移除货币符号和逗号
      const cleanValue = value.toString().replace(/[¥,]/g, '').trim()
      const parsed = parseFloat(cleanValue)
      return isNaN(parsed) ? 0 : parsed
    }

    // 处理飞书公式字段格式: {type: 2, value: [number]}
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.value !== undefined) {
        // 递归处理 value 属性
        return this.parseCurrency(value.value)
      }
    }

    if (Array.isArray(value) && value.length > 0) {
      // 如果是数组，取第一个元素
      return this.parseCurrency(value[0])
    }

    return 0
  }

  /**
   * 解析日期
   */
  private static parseDate(value: any): Date {
    if (value === null || value === undefined || value === '') {
      return new Date()
    }

    if (value instanceof Date) {
      return value
    }

    if (typeof value === 'number') {
      // 可能是Excel序列日期（天数从1900-01-01开始）
      if (value > 40000 && value < 60000) {
        // 转换Excel日期为JavaScript日期
        // Excel日期从1900-01-01开始，但JavaScript从1970-01-01开始
        const excelEpoch = new Date(1900, 0, 1)
        const daysOffset = value - 2 // Excel错误地认为1900年是闰年，所以减2天
        const jsDate = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000)
        return jsDate
      }
      // 可能是时间戳
      return new Date(value)
    }

    if (typeof value === 'string') {
      // 尝试解析各种日期格式
      const dateStr = value.toString().trim()

      // ISO格式
      if (dateStr.includes('T') || dateStr.includes('-')) {
        const parsed = new Date(dateStr)
        return isNaN(parsed.getTime()) ? new Date() : parsed
      }

      // 中文格式：2025/11/17
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          const year = parseInt(parts[0])
          const month = parseInt(parts[1]) - 1
          const day = parseInt(parts[2])
          const parsed = new Date(year, month, day)
          return isNaN(parsed.getTime()) ? new Date() : parsed
        }
      }
    }

    if (Array.isArray(value) && value.length > 0) {
      // 如果是数组，取第一个元素
      const firstItem = value[0]
      if (firstItem && typeof firstItem === 'object' && firstItem.text) {
        return this.parseDate(firstItem.text)
      }
      return this.parseDate(value[0])
    }

    return new Date()
  }

  /**
   * 分析字段映射
   */
  static analyzeFields(records: BitableRecord[]): FieldMapping {
    if (records.length === 0) {
      return {}
    }

    const firstRecord = records[0]
    const mapping: FieldMapping = {}
    const fields = Object.keys(firstRecord.fields)

    // 基于字段名推断映射
    for (const field of fields) {
      const fieldName = field.toLowerCase()

      // 基于关键词匹配
      if (fieldName.includes('产品名称') || fieldName.includes('基金名称')) {
        mapping[field] = 'name'
      } else if (fieldName.includes('策略')) {
        mapping[field] = 'strategy'
      } else if (fieldName.includes('经理')) {
        mapping[field] = 'manager'
      } else if (fieldName.includes('净值日期') || fieldName.includes('最新净值')) {
        mapping[field] = 'latestNavDate'
      } else if (fieldName.includes('累计收益率') || fieldName.includes('累计盈亏')) {
        mapping[field] = 'cumulativeReturn'
      } else if (fieldName.includes('年化收益率') || fieldName.includes('年化')) {
        mapping[field] = 'annualizedReturn'
      } else if (fieldName.includes('最大回撤') || fieldName.includes('回撤')) {
        mapping[field] = 'maxDrawdown'
      } else if (fieldName.includes('夏普')) {
        mapping[field] = 'sharpeRatio'
      } else if (fieldName.includes('波动率') || fieldName.includes('波动')) {
        mapping[field] = 'volatility'
      } else if (fieldName.includes('总规模') || fieldName.includes('规模')) {
        mapping[field] = 'totalAssets'
      } else if (fieldName.includes('存续规模')) {
        mapping[field] = 'standingAssets'
      } else if (fieldName.includes('站岗资金')) {
        mapping[field] = 'cashAllocation'
      } else if (fieldName.includes('状态')) {
        mapping[field] = 'status'
      } else if (fieldName.includes('成立日期') || fieldName.includes('成立')) {
        mapping[field] = 'establishmentDate'
      } else if (fieldName.includes('成本')) {
        mapping[field] = 'cost'
      } else if (fieldName.includes('集中度')) {
        mapping[field] = 'concentration'
      }
    }

    return mapping
  }
}