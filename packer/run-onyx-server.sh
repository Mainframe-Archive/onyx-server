#!/usr/bin/env bash
set -x

SLEEP_TIME=20
HOME_DIR="/home/ubuntu"
CERTS_DIR="$HOME_DIR/certs"

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
