import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Configuration
const NEGATIVE_KEYWORDS = ['处罚', '违规', '违约', '欺诈', '亏损', '诉讼', '造假', '警示'];
const MAX_RESULTS = 20;

// Helper to fetch with timeout and headers
async function fetchWithTimeout(url: string, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'zh-CN,zh;q=0.9',
            },
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// Baidu Search Scraper (Simplified)
async function baiduSearch(query: string) {
    try {
        const url = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
        const response = await fetchWithTimeout(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const links: string[] = [];
        $('#content_left .result .c-container h3 a').each((_, element) => {
            const link = $(element).attr('href');
            if (link) links.push(link);
        });

        return links.slice(0, 10);
    } catch (error) {
        console.error('Baidu search failed:', error);
        return [];
    }
}

// Content Analysis
async function analyzeContent(url: string, companyName: string) {
    try {
        const response = await fetchWithTimeout(url, 8000);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts and styles
        $('script').remove();
        $('style').remove();

        const text = $('body').text().replace(/\s+/g, ' ').trim();
        const snippet = text.substring(0, 200) + '...';

        // Keyword matching
        let keywordCount = 0;
        const foundKeywords: string[] = [];

        NEGATIVE_KEYWORDS.forEach(keyword => {
            const regex = new RegExp(keyword, 'g');
            const count = (text.match(regex) || []).length;
            if (count > 0) {
                keywordCount += count;
                foundKeywords.push(keyword);
            }
        });

        // Simple sentiment score (0-1, lower is more negative)
        // If keywords found, score drops
        let sentimentScore = 0.8; // Default neutral-positive
        if (keywordCount > 0) {
            sentimentScore = Math.max(0.1, 0.8 - (keywordCount * 0.1));
        }

        return {
            url,
            title: $('title').text().trim() || 'No Title',
            snippet,
            sentimentScore,
            keywordCount,
            foundKeywords,
            date: new Date().toISOString().split('T')[0] // Approximate
        };
    } catch (error) {
        // console.error(`Failed to analyze ${url}:`, error);
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const { company } = await request.json();

        if (!company) {
            return NextResponse.json({ success: false, error: 'Company name is required' }, { status: 400 });
        }

        // Construct queries
        const queries = NEGATIVE_KEYWORDS.slice(0, 3).map(kw => `${company} ${kw}`); // Limit to top 3 keywords to save time

        let allLinks: string[] = [];

        // Parallel search (limit to first query for speed in this demo)
        const searchLinks = await baiduSearch(`${company} 负面`);
        allLinks = [...new Set(searchLinks)]; // Deduplicate

        // Analyze results
        const results = [];
        for (const link of allLinks.slice(0, 5)) { // Limit to top 5 for performance
            const analysis = await analyzeContent(link, company);
            if (analysis && analysis.keywordCount > 0) {
                results.push({
                    company,
                    ...analysis
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Monitor API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
