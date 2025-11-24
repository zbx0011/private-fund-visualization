/**
 * Financial Calculation Utilities
 */

/**
 * Calculate Max Drawdown
 * @param navs Array of cumulative net asset values (NAV)
 * @returns Max drawdown as a positive decimal (e.g., 0.15 for 15%)
 */
export function calculateMaxDrawdown(navs: number[]): number {
    if (!navs || navs.length === 0) return 0;

    let maxNav = navs[0];
    let maxDrawdown = 0;

    for (const nav of navs) {
        if (nav > maxNav) {
            maxNav = nav;
        }
        const drawdown = (maxNav - nav) / maxNav;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }

    return maxDrawdown;
}

/**
 * Calculate Annualized Volatility
 * @param returns Array of daily returns (decimal, e.g., 0.01 for 1%)
 * @param periodsPerYear Number of trading days per year (default 252)
 * @returns Annualized volatility as a decimal
 */
export function calculateVolatility(returns: number[], periodsPerYear: number = 252): number {
    if (!returns || returns.length < 2) return 0;

    const n = returns.length;
    const mean = returns.reduce((sum, r) => sum + r, 0) / n;

    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);

    return stdDev * Math.sqrt(periodsPerYear);
}

/**
 * Calculate Sharpe Ratio
 * @param returns Array of daily returns (decimal)
 * @param riskFreeRate Annual risk-free rate (decimal, default 0.02 for 2%)
 * @param periodsPerYear Number of trading days per year (default 252)
 * @returns Sharpe Ratio
 */
export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02, periodsPerYear: number = 252): number {
    if (!returns || returns.length < 2) return 0;

    const volatility = calculateVolatility(returns, periodsPerYear);
    if (volatility === 0) return 0;

    // Annualized Return Calculation (Geometric Mean is more accurate for long term, but Arithmetic Mean is often used for Sharpe)
    // Here we use annualized arithmetic mean of daily returns for consistency with standard Sharpe formula: (Rp - Rf) / sigma
    // Rp = Annualized Average Return = Average Daily Return * 252

    const n = returns.length;
    const meanDailyReturn = returns.reduce((sum, r) => sum + r, 0) / n;
    const annualizedReturn = meanDailyReturn * periodsPerYear;

    return (annualizedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate Annualized Return (CAGR)
 * @param totalReturn Total return as decimal (e.g., 0.5 for 50%)
 * @param days Number of days in the period
 * @returns Annualized return as decimal
 */
export function calculateAnnualizedReturn(totalReturn: number, days: number): number {
    if (days <= 0) return 0;
    const years = days / 365;
    return Math.pow(1 + totalReturn, 1 / years) - 1;
}
