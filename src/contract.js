// @flow

import Web3Contract from 'web3-eth-contract'

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

const STAKE_ADDR = '0xcca509c2bf487221cc297c7c1b663afc5c113842'

export default (web3url: string) => {
  Web3Contract.setProvider(web3url)
  const stakeContract = new Web3Contract(STAKE_ABI, STAKE_ADDR)

  const hasStake = (address: string): Promise<boolean> =>
    new Promise((resolve, reject) => {
      stakeContract.methods.hasStake(address).call((err, res) => {
        if (err) reject(err)
        else resolve(res)
      })
    })

  return { hasStake }
}
