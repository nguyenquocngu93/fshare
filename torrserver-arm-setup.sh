#!/usr/bin/env bash
set -e
echo "[1/2] Ghi key SSH ..."
mkdir -p ~/.ssh && chmod 700 ~/.ssh
cat > ~/.ssh/vmkey <<'SSHKEY'
-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEA0rFbHenqffLMORqZOUZ/Faberze6+1QQQi4jH1AVhHbZWQtK
iLQJYCQUkbS14aXV0/ZO1RnemtdfO574VNt/h9em6RciaPkofbuYHje6SaS7BtVB
ypmy3Prirfg4cBenNgbEWiMWr3wMSBM1HS2FOyZzyX/Gqmhwz3ihJ/eA98XMM+we
tiVUdrKzDigYPogDXXVsiJo4EKl6NVkl346wbUCchJEpPHGAjj10ubdEqj/pacPr
nMqgQP7aFcN8lGIRkDxqJ3hd7uD6CgzJpYiqRp9amQdvzFHwZHPsDRMJ35Vrj185
Fp0Vd5+ga/5d/0FJjYes4rwsg3qhM08oOpfDMQIDAQABAoIBAAXYxh6JDz4k2WX8
RvmVQJGT6o9njIN3obvfFo/CjoD5NgQykVmZ0BN1l4czl0MxHENK4oUnYqC0Dqso
44X3UWKuVANukOs41CwpDd+eIZ1Jj6cbjpKAvBCbJbnjhC1tepu/3v22sOUjHB7O
lFAVo0zblFBTK2rZ2xzmzBIVMY8D8TqXFTTAN5ClvxSlwxlhXJqR6OA6nYunFhAr
kDY4vgpvlI41kBscg0oAsps2R5nEQ4QeQq94kT1AQby33xPDdHT9JEz2mXcLQqPN
8ujdJqTwZVOi3I8167uqxj/HpNAOXgRhOgYN/Z2h1gTLhMWatZtJNsFXqJLjvePx
TuSDu8ECgYEA/mJUSgjog1JDUZyGI4793rekxw57dqklLBxaT7K3GlKffjJkSmSG
HjdlJ0qcrL4Duq3QFkdo878VBbkyQJPzCL4BqVTBeceMv53QkMhUaHsjlvuXcw7Z
bZTT5R2hdQQ8UUSR6WTzk/vjqDxQmQh7FB13dnK1oQFWwHqyEnm+Mf8CgYEA1Af6
NJs1E9X8joa444ogMrvLqC3N/VTY5Xmcb9L+xnRNLaWVdaVYdzF/cUtRwHSzLk4Y
aYwaQRWY5I2Dj/KQaTpbOoVbJcyTbZqypMLrgVAfevogYcwi426dgVIWGKcZj8VH
J6GE9DX+RVQ/kQFbhyyp01s6c4BoFbE4Fm9mqs8CgYAQ72TjJOKt020t4ri/Z0aZ
bCppIhqwFKSn4h9VDPXJp9R8Z0hr93NCUbfHPN1fVqsS431l7k0bZQ42OlURHYhh
fZzItB7JR7KkExKOgPe1mPUOmSNFAqkQ9YaBy04zZxvI4ULBgfoBURSf35wSBBGF
jkyksxBKbrdiywhN2JMD6wKBgEq1lN+8YHNgzuCZb8QdA0NdEGFt4ksE/ne85fYw
7jyW9irDUWpmnElDU5hj5aZeeFQ0iD2IdCfCqGC/zD+IRIIPYd2452jmMHxKKfAM
Dlc+GBmI0Kgk+ZYRf8X1WnvNRSB3bp70Npil/bYH/W3mgI2cmyox1uKjuAkMrKqb
Dh3ZAoGAR7HpRLvKsSUVNf45GX360/xRme0S3j18STl7/nuZXUNoOhjFwdrMLMOi
xuwfV3vFfGtvdQFA7hwSlHov6uVXkbbtgfYiEm5UfOBKMhefh4+q6RZVaP6yGbKR
WkSfANkUCs/mWANHio8RP2HdFQqo+phAlv5Y+alklNpqMel1LMc=
-----END RSA PRIVATE KEY-----
SSHKEY
chmod 600 ~/.ssh/vmkey
echo "[2/2] SSH vao may va cai TorrServer ..."
ssh -o StrictHostKeyChecking=accept-new -i ~/.ssh/vmkey opc@161.118.192.95 'sudo bash -s' <<'INSTALL'
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
echo "  TorrServer da cai. Dung PUBLIC IP:8090 tren trinh duyet"
echo "  (khong dung 10.0.0.x - do la IP noi bo)"
echo "================================================="
INSTALL
rm -f ~/.ssh/vmkey
echo "DONE."
