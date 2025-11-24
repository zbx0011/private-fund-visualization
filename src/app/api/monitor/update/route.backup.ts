import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
    try {
        const scriptPath = path.join(process.cwd(), 'scripts', 'scrape-qyyjt-with-login.js');

        console.log('Starting scraper manually...');

        // Spawn the scraper process
        const scraperProcess = spawn('node', [scriptPath], {
            cwd: process.cwd(),
            stdio: 'inherit' // Pipe output to parent process
        });

        // We don't wait for it to finish to return the response, 
        // but in a real app we might want to track status. 
        // For now, we return success immediately saying it started.

        return NextResponse.json({
            success: true,
            message: 'Scraper started successfully. Please wait for data to update.'
        });

    } catch (error) {
        console.error('Failed to start scraper:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to start scraper'
        }, { status: 500 });
    }
}
