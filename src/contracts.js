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

export default (web3Url: string, stakeEnsName: string, resolverAddress: string) => {
  Web3Contract.setProvider(web3Url)

  const ensHash = namehash(stakeEnsName)
  const resolverContract = new Web3Contract(RESOLVER_ABI, resolverAddress)

  const hasStake = (address: string): Promise<boolean> =>
    new Promise((resolve, reject) => {
      resolverContract.methods.addr(ensHash).call((err, stakeAddress) => {
        if (err) resolve(false)
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
