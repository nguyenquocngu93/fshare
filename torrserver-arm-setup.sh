#!/usr/bin/env bash
set -e
echo "[1/2] Ghi key SSH ..."
mkdir -p ~/.ssh && chmod 700 ~/.ssh
cat > ~/.ssh/vmkey <<'SSHKEY'
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBg1mEr+X2YYMkmHiETJb6La3yA3H9qTTdSOopmYJ971gAAAJC6ae1bumnt
WwAAAAtzc2gtZWQyNTUxOQAAACBg1mEr+X2YYMkmHiETJb6La3yA3H9qTTdSOopmYJ971g
AAAEC11Iex5LI0cbnvEOnA0BckJwWsDuCgyi2WO5CkEfn/rmDWYSv5fZhgySYeIRMlvotr
fIDcf2pNN1I6imZgn3vWAAAACWFybS1maW5hbAECAwQ=
-----END OPENSSH PRIVATE KEY-----
SSHKEY
chmod 600 ~/.ssh/vmkey
echo "[2/2] SSH vao may va cai TorrServer ..."
ssh -o StrictHostKeyChecking=accept-new \
    -o HostKeyAlgorithms=+ssh-rsa,ssh-dss \
    -o PubkeyAcceptedAlgorithms=+ssh-rsa \
    -o KexAlgorithms=+diffie-hellman-group14-sha1,diffie-hellman-group-exchange-sha1,diffie-hellman-group1-sha1 \
    -i ~/.ssh/vmkey opc@161.118.192.95 'sudo bash -s' <<'INSTALL'
set -e
echo "==> TorrServer installer (Oracle Linux ARM)"
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) BIN="TorrServer-linux-amd64" ;;
  aarch64|arm64) BIN="TorrServer-linux-arm64" ;;
  *) echo "Kien truc khong ho tro: $ARCH"; exit 1 ;;
esac
echo "    Kien truc: $ARCH -> $BIN"
VERSION="MatriX.142.2"
URL="https://github.com/YouROK/TorrServer/releases/download/${VERSION}/${BIN}"
mkdir -p /opt/torrserver && cd /opt/torrserver
if command -v curl >/dev/null 2>&1; then curl -L --retry 3 -o TorrServer "$URL"; else wget -O TorrServer "$URL"; fi
chmod +x TorrServer
cat > /etc/systemd/system/torrserver.service <<'UNIT'
[Unit]
Description=TorrServer
After=network.target
[Service]
Type=simple
User=root
WorkingDirectory=/opt/torrserver
ExecStart=/opt/torrserver/TorrServer
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable torrserver 2>/dev/null || true
systemctl restart torrserver
if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --add-port=8090/tcp >/dev/null 2>&1 || true
  firewall-cmd --reload >/dev/null 2>&1 || true
fi
command -v semanage >/dev/null 2>&1 && semanage port -a -t http_port_t -p tcp 8090 2>/dev/null || true
sleep 2
systemctl --no-pager --lines=8 status torrserver || true
echo ""
echo "===================== XONG ====================="
echo "  TorrServer da cai. Mo trinh duyet:  http://${NEW_IP}:8090"
echo "================================================="
INSTALL
rm -f ~/.ssh/vmkey
echo "DONE."
