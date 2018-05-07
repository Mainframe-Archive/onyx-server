#!/usr/bin/env bash

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <data-directory> <port=30999> <wsport=8546>"
  exit 1
fi

GIT_TAG="swarm-summit-onyx"
DATADIR="$1"
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
EXT_DEPS_DIR="$SCRIPTPATH/external_deps"
GODIR="$EXT_DEPS_DIR/go-ethereum"
PORT=${2:-30999}
WSPORT=${3:-8546}

mkdir -p "$EXT_DEPS_DIR"

if [[ ! -e $GODIR ]]; then
    echo "cloning the go-ethereum repo"
    cd "$EXT_DEPS_DIR"
    git clone --depth 1 https://github.com/MainframeHQ/go-ethereum.git -b $GIT_TAG
fi

cd "$GODIR"
# doing the fetch here and now makes sure that we can change the chosen
# commit hash without the risk of breaking the script
git fetch --depth 1 origin $GIT_TAG
git checkout $GIT_TAG
make geth
make swarm

if [[ ! -e $DATADIR/keystore ]]; then
  mkdir -p $DATADIR
  passphrase=`openssl rand -base64 32`
  echo $passphrase > $DATADIR/password
  $GODIR/build/bin/geth --datadir $DATADIR account new --password $DATADIR/password
fi

which jq
if [ $? -eq 0 ]
then
    KEY=$(jq --raw-output '.address' $DATADIR/keystore/*)
else
    printf "\n\nERROR: jq is required to run the startup script\n\n"
    exit 1
fi

$GODIR/build/bin/swarm \
    --store.size 1 \
    --store.cache.size 1 \
    --port $PORT \
    --datadir $DATADIR \
    --password $DATADIR/password \
    --verbosity 4 \
    --bzzaccount $KEY \
    --bootnodes enode://867ba5f6ac80bec876454caa80c3d5b64579828bd434a972bd8155060cac36226ba6e4599d955591ebdd1b2670da13cbaba3878928f3cd23c55a4e469a927870@13.79.37.4:30399 \
    --ws \
    --wsport $WSPORT \
    --wsorigins '*'
