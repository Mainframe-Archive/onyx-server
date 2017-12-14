#!/usr/bin/env bash

set -x

# taken from https://github.com/MainframeHQ/onyx-server/blob/master/start_swarm_node.sh

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <data-directory>"
  exit 1
fi

DATADIR="$1"
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
BINARIES="/home/ubuntu/geth_binaries"

# cp build/bin/geth /home/ubuntu/geth_binaries
# cp build/bin/swarm /home/ubuntu/geth_binaries

if [[ ! -e $DATADIR/keystore ]]; then
  mkdir -p $DATADIR
  echo 'secret' > $DATADIR/password
  $BINARIES/geth --datadir $DATADIR account new --password $DATADIR/password
fi

which jq
if [ $? -eq 0 ]
then
    KEY=$(jq --raw-output '.address' $DATADIR/keystore/*)
else
    printf "\n\nERROR: jq is required to run the startup script\n\n"
    exit 1
fi

$BINARIES/swarm \
    --datadir $DATADIR \
    --password $DATADIR/password \
    --verbosity 4 \
    --bzzaccount $KEY \
    --pss \
    --bzznetworkid 922 \
    --bootnodes enode://e834e83b4ed693b98d1a31d47b54f75043734c6c77d81137830e657e8b005a8f13b4833efddbd534f2c06636574d1305773648f1f39dd16c5145d18402c6bca3@52.51.239.180:30399 \
    --ws \
    --wsorigins '*' \
    --ens-api ''

