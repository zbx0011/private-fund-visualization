import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.245.53.67', username='root', password='Y6t1A5kp7f0PK3moOR')

commands = [
    'cd /root/private-fund-visualization && ls -lh funds.db',
    'cd /root/private-fund-visualization && ls -lhd data',
    'cd /root/private-fund-visualization && cat .env | grep DATABASE',
    'cd /root/private-fund-visualization && sqlite3 funds.db "SELECT COUNT(*) FROM funds;"',
    'cd /root/private-fund-visualization && sqlite3 funds.db "SELECT COUNT(*) FROM fund_nav_history;"'
]

for cmd in commands:
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out:
        print(out)
    if err:
        print(f"ERROR: {err}")

ssh.close()
