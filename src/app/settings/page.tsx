'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/ui/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { RefreshCw, Settings, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface LarkConfig {
  appId: string
  appSecret: string
  appToken: string
  tableId?: string
  autoDetectTable: boolean
}

interface SyncHistory {
  id: number
  sync_type: string
  status: string
  records_processed: number
  records_updated: number
  records_inserted: number
  error_message?: string
  created_at: string
}

export default function SettingsPage() {
  const [config, setConfig] = useState<LarkConfig>({
    appId: '',
    appSecret: '',
    appToken: '',
    tableId: '',
    autoDetectTable: true
  })

  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    loadConfig()
    loadSyncHistory()
  }, [])

  const loadConfig = () => {
    // 从localStorage加载配置
    const savedConfig = localStorage.getItem('larkConfig')
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error('加载配置失败:', error)
      }
    }
  }

  const saveConfig = () => {
    localStorage.setItem('larkConfig', JSON.stringify(config))
    setMessage({ type: 'success', text: '配置已保存' })
    setTimeout(() => setMessage(null), 3000)
  }

  const loadSyncHistory = async () => {
    try {
      const response = await fetch('/api/lark-sync')
      const result = await response.json()
      if (result.success) {
        setSyncHistory(result.data.history || [])
      }
    } catch (error) {
      console.error('加载同步历史失败:', error)
    }
  }

  const handleSync = async () => {
    if (!config.appId || !config.appSecret || !config.appToken) {
      setMessage({ type: 'error', text: '请先完成飞书配置' })
      return
    }

    setSyncing(true)
    setMessage(null)

    try {
      const response = await fetch('/api/lark-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appId: config.appId,
          appSecret: config.appSecret,
          appToken: config.appToken,
          tableId: config.tableId,
          autoDetectTable: config.autoDetectTable
        })
      })

      const result = await response.json()

      if (result.success) {
        const syncResult = result.result
        setMessage({
          type: 'success',
          text: `同步成功！处理${syncResult.recordsProcessed}条记录，更新${syncResult.recordsUpdated}条，插入${syncResult.recordsInserted}条`
        })
        // 重新加载同步历史
        loadSyncHistory()
      } else {
        setMessage({ type: 'error', text: result.error || '同步失败' })
      }
    } catch (error) {
      console.error('同步失败:', error)
      setMessage({ type: 'error', text: '同步失败，请检查网络连接' })
    } finally {
      setSyncing(false)
    }

    setTimeout(() => setMessage(null), 5000)
  }

  const handleGetTableInfo = async () => {
    if (!config.appId || !config.appSecret || !config.appToken) {
      setMessage({ type: 'error', text: '请先完成飞书配置' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/lark-sync?action=get-table-info&appToken=${config.appToken}&appId=${config.appId}&appSecret=${config.appSecret}`)
      const result = await response.json()

      if (result.success) {
        setMessage({
          type: 'info',
          text: `成功获取表格信息：${result.data.app.name}，包含${result.data.tables.length}个表格`
        })
      } else {
        setMessage({ type: 'error', text: result.error || '获取表格信息失败' })
      }
    } catch (error) {
      console.error('获取表格信息失败:', error)
      setMessage({ type: 'error', text: '获取表格信息失败，请检查配置' })
    } finally {
      setLoading(false)
    }

    setTimeout(() => setMessage(null), 3000)
  }

  const recentSync = syncHistory[0]
  const successCount = syncHistory.filter(s => s.status === 'success').length
  const totalRecords = syncHistory.reduce((sum, s) => sum + s.records_processed, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-3" />
            飞书数据同步设置
          </h1>
          <p className="text-gray-600 mt-2">配置飞书多维表格，实现数据自动同步</p>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-100 text-green-800' :
            message.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {message.type === 'success' && <CheckCircle className="mr-2 h-5 w-5" />}
            {message.type === 'error' && <AlertCircle className="mr-2 h-5 w-5" />}
            {message.type === 'info' && <Info className="mr-2 h-5 w-5" />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 配置面板 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 飞书应用配置 */}
            <Card>
              <CardHeader>
                <CardTitle>飞书应用配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={config.appId}
                    onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="飞书应用的App ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App Secret
                  </label>
                  <input
                    type="password"
                    value={config.appSecret}
                    onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="飞书应用的App Secret"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={saveConfig}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    保存配置
                  </button>
                  <button
                    onClick={() => setConfig({ appId: '', appSecret: '', appToken: '', tableId: '', autoDetectTable: true })}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    重置
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* 多维表格配置 */}
            <Card>
              <CardHeader>
                <CardTitle>多维表格配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App Token (多维表格应用令牌)
                  </label>
                  <input
                    type="text"
                    value={config.appToken}
                    onChange={(e) => setConfig({ ...config, appToken: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="多维表格的App Token"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    从飞书多维表格URL中获取，格式：bascnxxxxxx
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    表格ID (可选)
                  </label>
                  <input
                    type="text"
                    value={config.tableId}
                    onChange={(e) => setConfig({ ...config, tableId: e.target.value })}
                    disabled={config.autoDetectTable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="表格ID，留空则自动检测"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoDetectTable"
                    checked={config.autoDetectTable}
                    onChange={(e) => setConfig({ ...config, autoDetectTable: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="autoDetectTable" className="text-sm text-gray-700">
                    自动检测基金数据表
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleGetTableInfo}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '获取中...' : '获取表格信息'}
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? '同步中...' : '立即同步'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧信息面板 */}
          <div className="space-y-6">
            {/* 同步统计 */}
            <Card>
              <CardHeader>
                <CardTitle>同步统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <MetricCard
                    title="最近同步"
                    value={recentSync ? new Date(recentSync.created_at).toLocaleDateString('zh-CN') : '无记录'}
                  />
                  <MetricCard
                    title="成功次数"
                    value={successCount}
                    format="number"
                  />
                  <MetricCard
                    title="总处理记录"
                    value={totalRecords}
                    format="number"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 使用说明 */}
            <Card>
              <CardHeader>
                <CardTitle>使用说明</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div>
                    <strong>1. 创建飞书应用</strong>
                    <p className="mt-1">在飞书开放平台创建应用，获取App ID和App Secret</p>
                  </div>
                  <div>
                    <strong>2. 创建多维表格</strong>
                    <p className="mt-1">在飞书中创建多维表格，设置字段结构</p>
                  </div>
                  <div>
                    <strong>3. 获取App Token</strong>
                    <p className="mt-1">从多维表格URL中获取App Token</p>
                  </div>
                  <div>
                    <strong>4. 配置并同步</strong>
                    <p className="mt-1">在页面中配置信息，点击同步按钮</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 同步历史 */}
        {syncHistory.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>同步历史</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">时间</th>
                      <th className="text-left py-2">状态</th>
                      <th className="text-left py-2">处理记录</th>
                      <th className="text-left py-2">更新记录</th>
                      <th className="text-left py-2">插入记录</th>
                      <th className="text-left py-2">错误信息</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncHistory.map((sync) => (
                      <tr key={sync.id} className="border-b">
                        <td className="py-2">
                          {new Date(sync.created_at).toLocaleString('zh-CN')}
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            sync.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {sync.status === 'success' ? '成功' : '失败'}
                          </span>
                        </td>
                        <td className="py-2">{sync.records_processed}</td>
                        <td className="py-2">{sync.records_updated}</td>
                        <td className="py-2">{sync.records_inserted}</td>
                        <td className="py-2 text-red-600 max-w-xs truncate">
                          {sync.error_message || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}