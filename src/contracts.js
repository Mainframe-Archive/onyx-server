// @flow

import Web3Contract from 'web3-eth-contract'
import Web3Utils from 'web3-utils'

const ENS_ABI = [
  {
    constant: true,
    inputs: [
      {
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'resolver',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    type: 'function',
  },
]

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
    constant: true,
    inputs: [
      {
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'addr',
    outputs: [
      {
        name: 'ret',
        type: 'address',
      },
    ],
    payable: false,
    type: 'function',
  },
]

const NO_ADDRESS = '0x0000000000000000000000000000000000000000'

const namehash = (name: string) => {
  let node =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  if (name !== '') {
    const labels = name.split('.')
    for (let i = labels.length - 1; i >= 0; i--) {
      node = Web3Utils.sha3(node + Web3Utils.sha3(labels[i]).slice(2), {
        encoding: 'hex',
      })
    }
  }
  return node.toString()
}

export default (web3Url: string, stakeEnsName: string, ensAddress: string) => {
  Web3Contract.setProvider(web3Url)

  const ensHash = namehash(stakeEnsName)
  const ensContract = new Web3Contract(ENS_ABI, ensAddress)

  const getResolverAddress = (): Promise<string> =>
    new Promise((resolve, reject) => {
      ensContract.methods.resolver(ensHash).call((err, address) => {
        if (err) reject(err)
        else if (address === NO_ADDRESS) reject(new Error('No address'))
        else resolve(address)
      })
    })

  const resolveStakeAddress = (resolverAddress: string): Promise<string> => {
    const resolverContract = new Web3Contract(RESOLVER_ABI, resolverAddress)
    return new Promise((resolve, reject) => {
      resolverContract.methods.addr(ensHash).call((err, stakeAddress) => {
        if (err) reject(err)
        else resolve(stakeAddress)
      })
    })
  }

  const stakeCheck = async (
    stakeAddress: string,
    walletAddress: string,
  ): Promise<boolean> => {
    const stakeContract = new Web3Contract(STAKE_ABI, stakeAddress)
    return new Promise((resolve, reject) => {
      stakeContract.methods.hasStake(walletAddress).call((err, res) => {
        if (err) reject(err)
        else resolve(res)
      })
    })
  }

  const hasStake = async (walletAddress: string): Promise<boolean> => {
    try {
      const resolverAddress = await getResolverAddress()
      const stakeAddress = await resolveStakeAddress(resolverAddress)
      return stakeCheck(stakeAddress, walletAddress)
    } catch (err) {
      console.warn(`Error trying to check stake for ${walletAddress}`, err)
      return false
    }
  }

  return { hasStake }
}
