// @flow

import type Conf from 'conf'

import { pubKeyToAddress } from './crypto'
import DB from './db'
import {
  setupPss,
  setupContactTopic,
  subscribeToStoredConvos,
} from './pss/client'
import createServer from './server'

const { ONYX_PORT, SWARM_HTTP_URL, SWARM_WS_URL, WEB3_URL } = process.env

type Options = {
  wsUrl?: string,
  httpUrl?: string,
  store?: Conf,
  port?: number,
  unsecure?: boolean,
  certsDir?: string,
  web3Url?: string,
  stakeEnsAddress?: string,
  ensResolverAddress?: string,
}

const start = async (opts: Options) => {
  const httpUrl =
    opts.httpUrl || SWARM_HTTP_URL || 'https://onyx-storage.mainframe.com'
  const wsUrl = opts.wsUrl || SWARM_WS_URL || 'ws://localhost:8546'
  const certsDir = opts.certsDir || 'certs'

  // Defaults to Mainnet
  const web3Url = opts.web3Url || 'https://mainnet.infura.io/36QrH5cKkbHihEoWH4zS'
  const stakeEns = opts.stakeEnsAddress || 'stake.mainframe.eth'
  const resolverAddress = opts.ensResolverAddress || '0x1da022710df5002339274aadee8d58218e9d6ab5'

  let port = opts.port
  if (port == null) {
    port = ONYX_PORT == null ? 5000 : parseInt(ONYX_PORT, 10)
  }
  // Setup DB using provided store (optional)
  const db = new DB(
    web3Url,
    stakeEns,
    resolverAddress,
    opts.store,
    `onyx-server-${port}`
  )
  // Connect to local Swarm node, this also makes the node's address and public key available in the db module
  const pss = await setupPss(db, wsUrl)

  // Derive wallet address from public key (stored as profile ID during setup)
  const profile = db.getProfile()
  if (profile == null) {
    throw new Error('Invalid setup')
  }
  const addr = pubKeyToAddress(profile.id)

  // Check if address has stake, throw otherwise
  const addrHasStake = await db.contracts.hasStake(addr)
  if (!addrHasStake) {
    const err: Object = new Error(`Missing stake for address ${addr}`)
    err.address = addr
    throw err
  }

  // Start listening to the "contact request" topic and handle these requests
  await setupContactTopic(pss, db)
  // Set subscriptions for stored convos
  await subscribeToStoredConvos(pss, db)
  // Start the BZZ and GraphQL server
  const server = await createServer(
    pss,
    db,
    httpUrl,
    port,
    !opts.unsecure,
    certsDir,
  )
  return server
}

export default start
