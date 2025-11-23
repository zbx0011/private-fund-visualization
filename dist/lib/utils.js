"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatCurrency = formatCurrency;
exports.formatPercent = formatPercent;
exports.formatPercentUnsigned = formatPercentUnsigned;
exports.formatConcentration = formatConcentration;
exports.formatNumber = formatNumber;
exports.formatLargeNumber = formatLargeNumber;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.getColorByValue = getColorByValue;
exports.getBgColorByValue = getBgColorByValue;
exports.calculateDateRange = calculateDateRange;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
/**
 * Class name merger
 */
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount))
        return '¥0';
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
function formatPercent(value, decimals = 2) {
    if (value === undefined || value === null || isNaN(value))
        return '0.00%';
    // value是小数形式（如0.1654表示16.54%），需要乘以100
    const percentValue = value * 100;
    return `${percentValue >= 0 ? '+' : ''}${percentValue.toFixed(decimals)}%`;
}
function formatPercentUnsigned(value, decimals = 2) {
    if (value === undefined || value === null || isNaN(value))
        return '0.00%';
    // 用于最大回撤、波动率等不需要显示"+"号的百分比，value是小数形式需要乘以100
    const percentValue = value * 100;
    return `${percentValue.toFixed(decimals)}%`;
}
function formatConcentration(value, decimals = 3) {
    if (value === undefined || value === null || isNaN(value))
        return '0.000%';
    // 集中度永远为正数，不需要显示"+"号，value是小数形式需要乘以100
    const percentValue = Math.max(0, value) * 100;
    return `${percentValue.toFixed(decimals)}%`;
}
function formatNumber(value, decimals = 2) {
    if (value === undefined || value === null || isNaN(value))
        return '0.00';
    return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}
function formatLargeNumber(value) {
    if (value === undefined || value === null || isNaN(value))
        return '0';
    if (value >= 100000000) {
        return `${(value / 100000000).toFixed(1)}亿`;
    }
    else if (value >= 10000) {
        return `${(value / 10000).toFixed(1)}万`;
    }
    else {
        return value.toString();
    }
}
function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}
function formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function getColorByValue(value) {
    if (value > 0)
        return 'text-green-600';
    if (value < 0)
        return 'text-red-600';
    return 'text-gray-600';
}
function getBgColorByValue(value) {
    if (value > 0)
        return 'bg-green-100 text-green-800';
    if (value < 0)
        return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
}
function calculateDateRange(range) {
    const end = new Date();
    const start = new Date();
    switch (range) {
        case '1M':
            start.setMonth(start.getMonth() - 1);
            break;
        case '3M':
            start.setMonth(start.getMonth() - 3);
            break;
        case '6M':
            start.setMonth(start.getMonth() - 6);
            break;
        case '1Y':
            start.setFullYear(start.getFullYear() - 1);
            break;
        case 'ALL':
        default:
            start.setFullYear(start.getFullYear() - 10); // 足够早的日期
            break;
    }
    return { start, end };
}
