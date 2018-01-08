#!/usr/bin/env bash

# taken from https://github.com/MainframeHQ/onyx-server/blob/master/start_swarm_node.sh

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
EXT_DEPS_DIR="$SCRIPTPATH/external_deps"
GODIR="$EXT_DEPS_DIR/go-ethereum"

mkdir -p "$EXT_DEPS_DIR"

if [[ ! -e $GODIR ]]; then
    echo "cloning the go-ethereum repo"
    cd "$EXT_DEPS_DIR"
    git clone https://github.com/MainframeHQ/go-ethereum.git
fi

cd "$GODIR"
# doing the fetch here and now makes sure that we can change the chosen
# commit hash without the risk of breaking the script
git fetch
git checkout onyx-0.4
make geth
make swarm

cp build/bin/geth /home/ubuntu/geth_binaries
cp build/bin/swarm /home/ubuntu/geth_binaries
