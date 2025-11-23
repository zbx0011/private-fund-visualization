module.exports = {
    apps: [{
        name: 'fund-visualization',
        script: 'node_modules/next/dist/bin/next',
        args: 'start',
        cwd: '/var/www/private-fund-visualization',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        }
    }]
}
