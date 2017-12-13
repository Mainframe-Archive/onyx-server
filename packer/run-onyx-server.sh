#!/usr/bin/env bash
set -x

SLEEP_TIME=20

echo "giving swarm $SLEEP_TIME seconds to start up"
sleep "$SLEEP_TIME"

echo "starting onyx-server"
onyx-server --port 5000 --http-url http://localhost:8500 --ws-url ws://localhost:8546 --unsecure
