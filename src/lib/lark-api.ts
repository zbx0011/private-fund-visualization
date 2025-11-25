import axios from 'axios'

interface LarkConfig {
  appId: string
  appSecret: string
  baseUrl?: string
}

interface Bitable {
  app_token: string
  table_id?: string
}

export interface BitableRecord {
  record_id: string
  fields: Record<string, any>
  created_time: number
  last_modified_time: number
}

interface BitableResponse {
  code: number
  msg: string
  data: {
    items?: BitableRecord[]
    has_more?: boolean
    page_token?: string
    total?: number
  }
}

export class LarkBitableAPI {
  private config: LarkConfig
  private accessToken: string | null = null
  private tokenExpireTime: number = 0

  constructor(config: LarkConfig) {
    this.config = {
      baseUrl: 'https://open.feishu.cn',
      ...config
    }
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string> {
    // 检查token是否过期
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken
    }

    try {
      const response = await axios.post(
        `${this.config.baseUrl}/open-apis/auth/v3/tenant_access_token/internal`,
        {
          app_id: this.config.appId,
          app_secret: this.config.appSecret
        }
      )

      if (response.data.code === 0) {
        this.accessToken = response.data.tenant_access_token
        // 提前5分钟刷新token
        this.tokenExpireTime = Date.now() + (response.data.expire - 300) * 1000
        return this.accessToken!
      } else {
        throw new Error(`获取访问令牌失败: ${response.data.msg}`)
      }
    } catch (error) {
      throw new Error(`飞书API认证失败: ${error}`)
    }
  }

  /**
   * 获取多维表格数据
   */
  async getBitableRecords(appToken: string, tableId: string, pageSize: number = 100): Promise<BitableRecord[]> {
    const accessToken = await this.getAccessToken()
    const records: BitableRecord[] = []
    let pageToken: string | undefined

    do {
      try {
        const url = `${this.config.baseUrl}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`
        const params: any = {
          page_size: pageSize
        }

        if (pageToken) {
          params.page_token = pageToken
        }

        const response = await axios.get<BitableResponse>(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params
        })

        if (response.data.code === 0) {
          const data = response.data.data
          if (data.items) {
            records.push(...data.items)
          }
          pageToken = data.page_token
        } else {
          throw new Error(`获取多维表格数据失败: ${response.data.msg}`)
        }
      } catch (error) {
        console.error('获取多维表格记录失败:', error)
        throw error
      }
    } while (pageToken)

    return records
  }

  /**
   * 获取多维表格元数据
   */
  async getBitableTables(appToken: string) {
    const accessToken = await this.getAccessToken()

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/open-apis/bitable/v1/apps/${appToken}/tables`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.code === 0) {
        return response.data.data.items || []
      } else {
        throw new Error(`获取多维表格元数据失败: ${response.data.msg}`)
      }
    } catch (error) {
      console.error('获取多维表格元数据失败:', error)
      throw error
    }
  }

  /**
   * 获取应用信息
   */
  async getBitableApp(appToken: string) {
    const accessToken = await this.getAccessToken()

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/open-apis/bitable/v1/apps/${appToken}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.code === 0) {
        return response.data.data.app
      } else {
        throw new Error(`获取多维表格应用失败: ${response.data.msg}`)
      }
    } catch (error) {
      console.error('获取多维表格应用失败:', error)
      throw error
    }
  }

  /**
   * 获取字段信息
   */
  async getBitableFields(appToken: string, tableId: string) {
    const accessToken = await this.getAccessToken()

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.code === 0) {
        return response.data.data.items || []
      } else {
        throw new Error(`获取字段信息失败: ${response.data.msg}`)
      }
    } catch (error) {
      console.error('获取字段信息失败:', error)
      throw error
    }
  }
}

// 默认导出实例
export const larkAPI = new LarkBitableAPI({
  appId: process.env.LARK_APP_ID || '',
  appSecret: process.env.LARK_APP_SECRET || ''
})