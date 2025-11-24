# External Monitor Web Scraper - Usage Guide

## Overview
The web scraper collects external monitoring information and stores it in the database.

## Quick Start

```bash
# Run scraper with target URL
node scripts/scrape-external-monitor.js "https://example.com/monitor"
```

## Components

1. **Database**: `src/lib/external-monitor-db.ts`
2. **Scraper**: `scripts/scrape-external-monitor.js`  
3. **API**: `src/app/api/monitor/route.ts`
4. **Frontend**: `src/components/modules/ExternalMonitorModule.tsx`

## Customization

Edit `scrape-external-monitor.js` to match your target website's HTML structure.

## Scheduling (VPS)

```bash
# Run daily at 8 AM
crontab -e
0 8 * * * cd /var/www/private-fund-visualization && node scripts/scrape-external-monitor.js "URL"
```

## API

`GET /api/monitor?sentiment=负面&limit=20`

## Troubleshooting

- **No data**: Check URL and table selectors
- **Blocked**: Add delays between requests
- **暂无数据**: Run scraper first to populate database
