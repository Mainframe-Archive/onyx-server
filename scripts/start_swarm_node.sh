#!/usr/bin/env bash

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <data-directory>"
  exit 1
fi

GIT_TAG="onyx-0.5"
DATADIR="$1"
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
EXT_DEPS_DIR="$SCRIPTPATH/external_deps"
GODIR="$EXT_DEPS_DIR/go-ethereum"

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
  echo 'secret' > $DATADIR/password
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
    --datadir $DATADIR \
    --password $DATADIR/password \
    --verbosity 4 \
    --bzzaccount $KEY \
    --ens-api 'https://ropsten.infura.io/55HkPWVAJQjGH4ucvfW9' \
    --bzznetworkid 1000 \
    --nosync \
    --bootnodes enode://b3417a20b07104ce2f948d7458fc03c73ad5918ae6be24eaf840322c70ffa8d0f59473139bef8ef0b4caffe7bc99018ab3686b1a757d73c1a7bfd880d2b7e7ef@52.31.117.198:30399,enode://762d482f6a400c89210be4d180b192dd5f921ca9f1a42a1651293f242613874f3e4e22589be582e0837c816c0c5366c00c32b7760ca345d65eb9ed75897db8c0@54.153.70.43:30399,enode://fc8d3eb2d5cfe4ed05c9e722518c895e006456448a49c2915e30beffd1ddb1ee17cd12abd550f1745d8b17060bf6c46e822e051ae4deca0e21d7fa7a15bb4c43@13.113.67.30:30399 \
    --ws \
    --wsorigins '*'

