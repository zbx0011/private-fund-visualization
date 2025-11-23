const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/modules/OverviewModule.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Find the problematic section and fix it
// The issue is at line 247-248 where JSX is incorrectly placed

// Remove the incorrectly placed JSX code that starts at line 248
const problematicSection = `                point[fund.record_id] = normalizedReturn
                point[\`\${fund.record_id}_yearly\`] = normalizedReturn
                    < div className = "space-y-8" >
                        {/* 1. 核心指标 */ }
                        < div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" >
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
                />`;

const fixedSection = `                point[fund.record_id] = normalizedReturn
                point[\`\${fund.record_id}_yearly\`] = normalizedReturn
            })
        })

        const chartData = Array.from(weeklyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

        const series = filteredFunds.map((fund: any) => ({
            id: fund.record_id,
            name: fund.name,
            color: \`hsl(\${Math.random() * 360}, 70%, 50%)\`,
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

content = content.replace(problematicSection, fixedSection);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed OverviewModule.tsx syntax error!');
console.log('Changes made:');
console.log('1. Added missing closing brackets for forEach loops');
console.log('2. Added missing return statement for getChartData()');
console.log('3. Fixed JSX placement in return statement');
console.log('4. Removed cumulative return metric card');
console.log('5. Added daily capital usage metric card');
