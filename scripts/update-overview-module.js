const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/modules/OverviewModule.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update metrics calculation (lines 41-72)
const oldMetricsCalc = `                if (json.success) {
                    const { funds, strategyStats, managerStats } = json.data

                    // Calculate aggregated metrics
                    const totalAssets = funds.reduce((sum: number, f: any) => sum + (f.cost || 0), 0)
                    const todayReturn = funds.reduce((sum: number, f: any) => sum + (f.daily_pnl || 0), 0)

                    // Calculate weighted average returns
                    const totalCost = totalAssets || 1
                    const weeklyReturn = funds.reduce((sum: number, f: any) => sum + (f.weekly_return || 0) * (f.cost || 0), 0) / totalCost
                    const annualReturn = funds.reduce((sum: number, f: any) => sum + (f.yearly_return || 0) * (f.cost || 0), 0) / totalCost
                    const totalReturn = funds.reduce((sum: number, f: any) => sum + (f.cumulative_return || 0) * (f.cost || 0), 0) / totalCost

                    // Map strategy stats
                    const strategyData = strategyStats.map((s: any) => ({
                        strategy: s.strategy,
                        value: s.total_cost || 0,
                        count: s.fund_count
                    }))

                    setData({
                        funds,
                        strategyStats,
                        managerStats,
                        totalAssets,
                        todayReturn,
                        weeklyReturn,
                        annualReturn,
                        totalReturn,
                        strategyData
                    })
                }`;

const newMetricsCalc = `                if (json.success) {
                    const { funds, strategyStats, managerStats } = json.data

                    // Filter funds by status
                    const normalFunds = funds.filter((f: any) => f.status === '正常')

                    // Calculate aggregated metrics
                    // 总规模: 仅包含状态正常的产品
                    const totalAssets = normalFunds.reduce((sum: number, f: any) => sum + (f.cost || 0), 0)
                    
                    // 总日均资金占用: 包含所有产品(含已赎回)
                    const totalDailyCapitalUsage = funds.reduce((sum: number, f: any) => sum + (f.cost || 0), 0)
                    
                    // 今日收益: 所有正常状态产品的日盈亏总和
                    const todayReturn = normalFunds.reduce((sum: number, f: any) => sum + (f.daily_pnl || 0), 0)

                    // Calculate weighted average returns (using normal funds)
                    const totalCost = totalAssets || 1
                    const weeklyReturn = normalFunds.reduce((sum: number, f: any) => sum + (f.weekly_return || 0) * (f.cost || 0), 0) / totalCost
                    const annualReturn = normalFunds.reduce((sum: number, f: any) => sum + (f.yearly_return || 0) * (f.cost || 0), 0) / totalCost

                    // Map strategy stats
                    const strategyData = strategyStats.map((s: any) => ({
                        strategy: s.strategy,
                        value: s.total_cost || 0,
                        count: s.fund_count
                    }))

                    setData({
                        funds,
                        strategyStats,
                        managerStats,
                        totalAssets,
                        totalDailyCapitalUsage,
                        todayReturn,
                        weeklyReturn,
                        annualReturn,
                        strategyData
                    })
                }`;

content = content.replace(oldMetricsCalc, newMetricsCalc);

// 2. Update metric cards (remove cumulative return, add daily capital usage)
const oldMetricCards = `                <MetricCard
                    title="总规模"
                    value={data.totalAssets}
                    format="currency"
                    className="col-span-1"
                />
                <MetricCard
                    title="今日收益"
                    value={data.todayReturn}
                    change={data.todayReturn}
                    format="currency"
                    className="col-span-1"
                />
                <MetricCard
                    title="本周收益率"
                    value={data.weeklyReturn}
                    format="percent"
                    className="col-span-1"
                />
                <MetricCard
                    title="本年收益率"
                    value={data.annualReturn}
                    format="percent"
                    className="col-span-1"
                />
                <MetricCard
                    title="累计收益率"
                    value={data.totalReturn}
                    format="percent"
                    className="col-span-1"
                />`;

const newMetricCards = `                <MetricCard
                    title="总规模"
                    value={data.totalAssets}
                    format="currency"
                    className="col-span-1"
                />
                <MetricCard
                    title="总日均资金占用"
                    value={data.totalDailyCapitalUsage}
                    format="currency"
                    className="col-span-1"
                />
                <MetricCard
                    title="今日收益"
                    value={data.todayReturn}
                    change={data.todayReturn}
                    format="currency"
                    className="col-span-1"
                />
                <MetricCard
                    title="本周收益率"
                    value={data.weeklyReturn}
                    format="percent"
                    className="col-span-1"
                />
                <MetricCard
                    title="本年收益率"
                    value={data.annualReturn}
                    format="percent"
                    className="col-span-1"
                />`;

content = content.replace(oldMetricCards, newMetricCards);

// 3. Remove asset allocation and update strategy distribution
const oldStrategySection = `            {/* 4. 策略分布 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>🥧 策略分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder for Pie Chart */}
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                            策略分布图表区域
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>📊 资产配置</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                            暂无详细配置数据
                        </div>
                    </CardContent>
                </Card>
            </div>`;

const newStrategySection = `            {/* 4. 策略分布 */}
            <Card>
                <CardHeader>
                    <CardTitle>🥧 策略分布</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.strategyData && data.strategyData.length > 0 ? (
                        <div className="h-[300px] overflow-auto">
                            <div className="grid grid-cols-2 gap-4 p-4">
                                {data.strategyData.map((item: any) => (
                                    <div key={item.strategy} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="font-medium">{item.strategy}</span>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600">¥{(item.value / 10000).toFixed(2)}万</div>
                                            <div className="text-xs text-gray-400">{item.count}只</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                            策略分布图表区域
                        </div>
                    )}
                </CardContent>
            </Card>`;

content = content.replace(oldStrategySection, newStrategySection);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ OverviewModule.tsx updated successfully!');
console.log('Changes made:');
console.log('1. Updated metrics calculation to filter by status');
console.log('2. Added totalDailyCapitalUsage metric');
console.log('3. Removed cumulative return metric card');
console.log('4. Removed asset allocation module');
console.log('5. Updated strategy distribution to show data');
