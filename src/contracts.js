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

const STAKE_ADDR = '0x7e16016df8c3d0a944cf568309b4214ab9856bee'

export default (web3url: string) => {
  Web3Contract.setProvider(web3url)
  const stakeContract = new Web3Contract(STAKE_ABI, STAKE_ADDR)

  const hasStake = (address: string): Promise<boolean> =>
    new Promise(resolve => {
      stakeContract.methods.hasStake(address).call((err, res) => {
        if (err) resolve(false)
        else resolve(res)
      })
    })

  return { hasStake }
}
