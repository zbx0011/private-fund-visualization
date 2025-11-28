import paramiko
import os
import tarfile
import sys
import time

# Configuration
VPS_HOST = "172.245.53.67"
VPS_USER = "root"
VPS_PASS = "Y6t1A5kp7f0PK3moOR"
PROJECT_PATH = "/root/private-fund-visualization"
ARCHIVE_NAME = "deploy_package.tar.gz"
LOCAL_ARCHIVE = os.path.join(os.getcwd(), ARCHIVE_NAME)

def create_archive():
    print(f"📦 Creating archive: {ARCHIVE_NAME}...")
    with tarfile.open(LOCAL_ARCHIVE, "w:gz") as tar:
        for item in os.listdir("."):
            if item in ["node_modules", ".git", ".next", ARCHIVE_NAME, "__pycache__", ".venv", ".env", "backups", "user_data"]:
                continue
            print(f"  Adding {item}...")
            tar.add(item)
    print("✅ Archive created.")

def deploy():
    try:
        # Connect
        print(f"🔌 Connecting to {VPS_HOST}...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, banner_timeout=200)
        
        sftp = ssh.open_sftp()

        # Upload
        print(f"📤 Uploading {ARCHIVE_NAME}...")
        sftp.put(LOCAL_ARCHIVE, f"/root/{ARCHIVE_NAME}")
        print("✅ Upload complete.")
        sftp.close()

        # Execute commands
        commands = [
            "pm2 stop all || true",
            f"if [ -d {PROJECT_PATH}/data ]; then cp -r {PROJECT_PATH}/data /root/data_backup_$(date +%s); fi",
            f"rm -rf {PROJECT_PATH}",
            f"mkdir -p {PROJECT_PATH}",
            f"tar -xzvf /root/{ARCHIVE_NAME} -C {PROJECT_PATH}",
            f"rm /root/{ARCHIVE_NAME}",
            f"cd {PROJECT_PATH} && npm install",
            f"cd {PROJECT_PATH} && npm run build",
            f"cd {PROJECT_PATH} && pm2 restart all || pm2 start npm --name 'fund-viz' -- start",
            "pm2 save"
        ]

        print("🛠️  Executing remote commands...")
        for cmd in commands:
            print(f"  Running: {cmd}")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            
            # Wait for command to complete and print output
            exit_status = stdout.channel.recv_exit_status()
            
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            
            if out:
                print(f"  [STDOUT] {out[:200]}..." if len(out) > 200 else f"  [STDOUT] {out}")
            if err:
                print(f"  [STDERR] {err}")
            
            if exit_status != 0:
                print(f"❌ Command failed with status {exit_status}")
                # Don't exit immediately, some commands like pm2 stop might fail if not running
                if "npm run build" in cmd or "npm install" in cmd:
                     sys.exit(1)

        print("✅ Deployment completed successfully!")
        ssh.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        if os.path.exists(LOCAL_ARCHIVE):
            os.remove(LOCAL_ARCHIVE)

if __name__ == "__main__":
    create_archive()
    deploy()
