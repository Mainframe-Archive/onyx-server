#!/usr/bin/env bash
set -x

SLEEP_TIME=20
HOME_DIR="/home/ubuntu"
CERTS_DIR="$HOME_DIR/certs"
# these should come out empty if the host doesn't have a public ip/hostname
PUBLIC_IP=$(curl -f --silent http://169.254.169.254/latest/meta-data/public-ipv4)
PUBLIC_HOSTNAME=$(curl -f --silent http://169.254.169.254/latest/meta-data/public-hostname)

echo "giving swarm $SLEEP_TIME seconds to start up"
sleep "$SLEEP_TIME"

if [[ ! -e $CERTS_DIR ]]; then
  ONYX_DIR="$(npm root -g)/onyx-server"

  pushd "$HOME_DIR"
  "$ONYX_DIR/scripts/gen-certs.sh"
  popd
fi

echo "starting onyx-server"
onyx-server --port 5000 --http-url https://onyx-storage.mainframe.com --ws-url ws://localhost:8546 --certs-dir "$CERTS_DIR"
