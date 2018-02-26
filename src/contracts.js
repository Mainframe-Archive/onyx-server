// @flow

import Web3Contract from 'web3-eth-contract'
import Web3Utils from 'web3-utils'

const STAKE_ABI = [
  {
    constant: true,
    inputs: [
      {
        name: '_address',
        type: 'address',
      },
    ],
    name: 'hasStake',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

const RESOLVER_ABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      }
    ],
    "name": "addr",
    "outputs": [
      {
        "name": "ret",
        "type": "address"
      }
    ],
    "payable": false,
    "type": "function"
  },
]

const INFURA_URLS = {
  ROPSTEN: 'https://ropsten.infura.io/KWLG1YOMaYgl4wiFlcJv',
  RINKEBY: 'https://rinkeby.infura.io/KWLG1YOMaYgl4wiFlcJv',
  MAINNET: 'https://mainnet.infura.io/KWLG1YOMaYgl4wiFlcJv',
}
const ENS_STAKE_NAMES = {
  ROPSTEN: 'stake.mainframe.test',
  RINKEBY: 'stake.mainframe.test',
  MAINNET: 'stake.mainframe.eth',
}

const PUBLIC_RESOLVER_ADDRESSES = {
  ROPSTEN: '0x4c641fb9bad9b60ef180c31f56051ce826d21a9a',
  RINKEBY: '0xb14fdee4391732ea9d2267054ead2084684c0ad8',
  MAINNET: '0x1da022710df5002339274aadee8d58218e9d6ab5',
}

const namehash = (name: string) => {
  var node = '0x0000000000000000000000000000000000000000000000000000000000000000'
  if (name !== '') {
    var labels = name.split('.')
    for(var i = labels.length - 1; i >= 0; i--) {
      node = Web3Utils.sha3(node + Web3Utils.sha3(labels[i]).slice(2), {encoding: 'hex'})
    }
  }
  return node.toString()
}

export default (ethNetwork: string) => {
  const WEB3_URL = INFURA_URLS[ethNetwork]
  const ENS_STAKE = ENS_STAKE_NAMES[ethNetwork]
  Web3Contract.setProvider(WEB3_URL)

  const ensHash = namehash(ENS_STAKE)
  const resolverContract = new Web3Contract(RESOLVER_ABI, PUBLIC_RESOLVER_ADDRESSES[ethNetwork])

  const hasStake = (address: string): Promise<boolean> =>
    new Promise((resolve, reject) => {
      resolverContract.methods.addr(ensHash).call((err, stakeAddress) => {
        if (err) reject(err)
        else {
          const stakeContract = new Web3Contract(STAKE_ABI, stakeAddress)
          stakeContract.methods.hasStake(address).call((err, res) => {
            if (err) resolve(false)
            else resolve(res)
          })
        }
      })
    })

  return { hasStake }
}
