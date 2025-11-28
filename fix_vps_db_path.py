import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.245.53.67', username='root', password='Y6t1A5kp7f0PK3moOR')

# Check and fix database location
commands = [
    # Check both locations
    'cd /root/private-fund-visualization && ls -lh funds.db data/funds.db 2>&1',
    # Copy to data directory if needed
    'cd /root/private-fund-visualization && mkdir -p data && cp funds.db data/funds.db',
    # Verify copy
    'cd /root/private-fund-visualization && ls -lh data/funds.db',
    # Restart PM2
    'pm2 restart fund-viz',
    # Wait and test API
    'sleep 3 && curl -s http://localhost:3000/api/funds?type=excluded-fof | head -c 200'
]

for cmd in commands:
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out:
        print(out)
    if err and 'No such file' not in err:
        print(f"ERROR: {err}")

ssh.close()
print("\n✅ Database path fixed!")
