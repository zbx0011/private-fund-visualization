#!/bin/bash
cd /var/www/private-fund-visualization
node scripts/scrape-qyyjt-with-login.js "https://www.qyyjt.cn/combination/20250603164207" "15622266864" "a511325678" > scraper_debug.log 2>&1
