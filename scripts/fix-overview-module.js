const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/modules/OverviewModule.tsx');

// Read the corrupted file
let content = fs.readFileSync(filePath, 'utf8');

// Find the corruption point (line 248 where JSX starts incorrectly)
const lines = content.split('\n');

// Find where the corruption starts (should be after "point[`${fund.record_id}_yearly`] = normalizedReturn")
const corruptionStart = lines.findIndex(line => line.includes('< div className = "space-y-8"'));

if (corruptionStart === -1) {
    console.log('File appears to be already fixed or corruption pattern not found');
    process.exit(0);
}

// The correct code should continue with:
// 1. Closing the forEach loop
// 2. Creating chartData from weeklyMap
// 3. Creating series from filteredFunds
// 4. Returning {chartData, series}
// 5. Then const {chartData, series} = getChartData()
// 6. Then return ( <div>...</div> )

const fixedSection = `            })
        })

        const chartData = Array.from(weeklyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

        const series = filteredFunds.map((fund: any, index: number) => ({
            id: fund.record_id,
            name: fund.name,
            color: \`hsl(\${index * 137.5 % 360}, 70%, 50%)\`,
            strokeWidth: 2,
            yearlyKey: \`\${fund.record_id}_yearly\`
        }))

        return { chartData, series }
    }

    const { chartData, series } = getChartData()

    return (
        <div className="space-y-8">
            {/* 1. 核心指标 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <MetricCard
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
                />
            </div>

            {/* 2. 近期事件提示 */}
            <Card>
                <CardHeader>
                    <CardTitle>🔔 近期事件提示</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                            <span className="font-bold">提示:</span> 景林资产净值更新延迟 (2025-11-20)
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
                            <span className="font-bold">信息:</span> 新增 3 只基金产品 (2025-11-19)
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. 收益率曲线 */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col space-y-4 w-full">
                        <div className="flex items-center justify-between">
                            <CardTitle>📈 收益率曲线</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedStrategy('all')}
                                className={\`px-3 py-1 text-sm rounded-full transition-colors \${selectedStrategy === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }\`}
                            >
                                全部策略
                            </button>
                            {STRATEGY_TYPES.map((strategy) => (
                                <button
                                    key={strategy}
                                    onClick={() => setSelectedStrategy(strategy)}
                                    className={\`px-3 py-1 text-sm rounded-full transition-colors \${selectedStrategy === strategy
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }\`}
                                >
                                    {strategy}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <YieldCurveChart data={chartData} series={series} />
                </CardContent>
            </Card>

            {/* 4. 策略分布 */}
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
            </div>
        </div>
    )
}
`;

// Replace from corruption point to end
const fixedLines = lines.slice(0, corruptionStart).concat(fixedSection.split('\n'));
const fixedContent = fixedLines.join('\n');

// Write the fixed content
fs.writeFileSync(filePath, fixedContent, 'utf8');
console.log('File fixed successfully!');
console.log(`Removed ${lines.length - fixedLines.length} corrupted lines`);
console.log(`New file has ${fixedLines.length} lines`);
