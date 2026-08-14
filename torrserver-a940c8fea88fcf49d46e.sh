#!/usr/bin/env bash
set -e
echo "[1/2] Ghi key SSH tam ..."
mkdir -p ~/.ssh && chmod 700 ~/.ssh
cat > ~/.ssh/vmkey <<'SSHKEY'
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAxmxIwgF5/Ob9Bx7qDL0jqlc0MrRMp2abuA+44YH5Q4aDayCB
RGaU935B3Cqk9Zo5gBuekt3YZMSJnYOSynq3aruH9tFaRefvtSbpJwQRnQj5PYD2
Vol9RX2cky+dTjXbQZOrrxKCgoDO8DjCTiw3XF520NX7v1O9ilmuXr/7RQmvTQWs
/zI0iXEvqYUY+iUUq7I7LKqSfxPoh5D5jt0ES1BjDQf2Z/Dul1zmfXnten3DtPiQ
QxuW+oPBFK6Dt74HquojpdqeC2RewhS18uMauKQe8tOcNxKDm8JwU4IfGdWP27T7
MpLh5RB51pggiQtqr7Z97fGloRI9rc2ORabTZQIDAQABAoIBAAPQcXZnqHYOS3Wt
yEDMb5LgfQ/IdXzDG5UzM17QxjJ55uBrtIoH3fwDJxyM8ugIIFJwTxQ/Q9/UA1oB
MHr7ih3fUvxeOkadVpDiszKqM/VGOeK1YVOsIVNXpQETT9cA1zq9R8L9/EvdhZzX
V0Z0OFadnkBJDL84/d8nkCy6f6FsRvKeOjzoeJiPNHEz6e7vZt4Dxi27WKO0Sr4G
lBFx454pQZ6iCD4GxTfi1WK7PAcv/do+EhMx9bMbLFp9y/G5520Pj8BD1lxVJVpV
a/9rApY1Z6XpnslCRZuJNeseVGo7dgrPRJk5dpJWliTCa/3Yx3fhTpQa2yAVyIaZ
M0/sAJUCgYEA8smCjm0MBuFdFxfXlo1UkiGMsoXA+aDCE4dTR8XEXd6LHTxOwq0P
vNtZD1ckW7W/tsJUdnDlwoBmS1i8tZkwdhowikeQOabgwUImg9EOGCO8nnhZiNCr
VgZ8Dc5vL2R/X2HFpBl5nvRSkBxiHV/SNeUcfHRzL0zp71da4TKFgncCgYEA0Tiy
Sux5BmQLcGS8w1HCsP1GdGQdA6nn/hDB7CRN4KdcQmIgs0qVwTpG9yRB6D+4G9s0
4dg318FtBgndO76rklg8a9g3kerFhKbUUjsRmvulu4wPiODNlLBMOeSSR4Bdkinu
KPOIlDkNJaTMzUGyDN6aKAp0auuleq5ex6uDFAMCgYEAoJJFlozod2R1fOB35Upz
tHIb67Yqeu6nbOMDYWSbCro0p5FLRdXPosgvjsXDdiQuN2EvG2ZvjsP847g8lp5K
PtHzaIEMEhUccLSfZG7PM4fvJ5/RF3tq1epUAY2WW3HMC/lODcoLdeWA9W7QNT06
egqdXHJn+9CSp4jOwkH3quECgYBh9MWlRqozT8v7R28Jk9Ivw6WlAOqEuJwh2/6v
bR/5OuJ7Qi5FQ3pyCbMIKzWgY5TzleJgizc6ERnWZe/q9Q6naiB/7a+25dCslt95
0KYhhgjGkoEDeR1HrHND97x1NaiZsoALNFqR61Q4d7xbrZKLa/2JGbwAA2xq0BEY
MzkfuQKBgQDIVUjDz7uTBHjGJtKs63Bp/aKgUPxUt1FNyFowqhwL/C0gihSL7oW3
YChkwP2x5GzUcxjeBr5yZMmEtZ10d9fiyrAhR+fkF+qaxYgVRveLTk1SgNEY/KiR
63UmNd/1YBUQms3GwMPhALtFCvmPVsFrVVawwLWbii69+KVP/RqOzA==
-----END RSA PRIVATE KEY-----
SSHKEY
chmod 600 ~/.ssh/vmkey
echo "[2/2] SSH vao may va cai TorrServer ..."
ssh -o StrictHostKeyChecking=accept-new -i ~/.ssh/vmkey opc@140.245.107.2 'sudo bash -s' <<'INSTALL'
set -e
echo "==> TorrServer installer (Oracle Linux)"
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) BIN="TorrServer-linux-amd64" ;;
  aarch64|arm64) BIN="TorrServer-linux-arm64" ;;
  *) echo "Kien truc khong ho tro: $ARCH"; exit 1 ;;
esac
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

echo "==> Xoay khoa SSH (vo hieu khoa cu) ..."
AK="/home/opc/.ssh/authorized_keys"
mkdir -p /home/opc/.ssh
touch "$AK"
grep -vF "AAAAB3NzaC1yc2EAAAADAQABAAABAQDGbEjCAXn85v0HHuoMvSOqVzQytEynZpu4D7jhgflDhoNrIIFEZpT3fkHcKqT1mjmAG56S3dhkxImdg5LKerdqu4f20VpF5++1JuknBBGdCPk9gPZWiX1FfZyTL51ONdtBk6uvEoKCgM7wOMJOLDdcXnbQ1fu/U72KWa5ev/tFCa9NBaz/MjSJcS+phRj6JRSrsjssqpJ/E+iHkPmO3QRLUGMNB/Zn8O6XXOZ9ee16fcO0+JBDG5b6g8EUroO3vgeq6iOl2p4LZF7CFLXy4xq4pB7y05w3EoObwnBTgh8Z1Y/btPsykuHlEHnWmCCJC2qvtn3t8aWhEj2tzY5FptNl" "$AK" > /tmp/ak.new 2>/dev/null || true
grep -qF "AAAAC3NzaC1lZDI1NTE5AAAAINi7CWHP4yYs4hbwb3I9bOzkP+r6AgW/IsUS0MB9tnIj" /tmp/ak.new 2>/dev/null || echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINi7CWHP4yYs4hbwb3I9bOzkP+r6AgW/IsUS0MB9tnIj torrserver-new" >> /tmp/ak.new
cat /tmp/ak.new > "$AK"
chmod 600 "$AK"
chown opc:opc "$AK" 2>/dev/null || true
echo "==> Khoa SSH da duoc xoay xong"

sleep 2
systemctl --no-pager --lines=8 status torrserver || true
IP=$(hostname -I | awk '{print $1}')
echo ""
echo "===================== XONG ====================="
echo "  TorrServer chay tai:  http://$IP:8090"
echo "================================================="
INSTALL
rm -f ~/.ssh/vmkey
echo "DONE."
