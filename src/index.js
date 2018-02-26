// @flow

import CryptoJS from 'crypto-js'
import type Conf from 'conf'

import DB from './db'
import {
  setupPss,
  setupContactTopic,
  subscribeToStoredConvos,
} from './pss/client'
import createContract from './contract'
import createServer from './server'

const { ONYX_PORT, SWARM_HTTP_URL, SWARM_WS_URL, WEB3_URL } = process.env

type Options = {
  wsUrl?: string,
  httpUrl?: string,
  store?: Conf,
  port?: number,
  unsecure?: boolean,
  certsDir?: string,
  ethNetwork?: string,
}

const start = async (opts: Options) => {
  const httpUrl =
    opts.httpUrl || SWARM_HTTP_URL || 'https://onyx-storage.mainframe.com'
  const wsUrl = opts.wsUrl || SWARM_WS_URL || 'ws://localhost:8546'
  const certsDir = opts.certsDir || 'certs'
  const web3Url =
    opts.web3url || WEB3_URL || 'https://rinkeby.infura.io/36QrH5cKkbHihEoWH4zS'
  const contract = createContract(opts.ethNetwork)

  let port = opts.port
  if (port == null) {
    port = ONYX_PORT == null ? 5000 : parseInt(ONYX_PORT, 10)
  }

  // Setup DB using provided store (optional)
  const db = new DB(opts.store, `onyx-server-${port}`)
  // Connect to local Swarm node, this also makes the node's address and public key available in the db module
  const pss = await setupPss(db, wsUrl)

  // Derive wallet address from public key (stored as profile ID during setup)
  const pubKey = CryptoJS.enc.Hex.parse(db.getProfile().id)
  const hash = CryptoJS.SHA3(pubKey, { outputLength: 256 })
  const addr = '0x' + hash.toString(CryptoJS.enc.Hex).slice(24)
  // Check if address has stake, throw otherwise
  const missingStake = () => {
    const err: Object = new Error(`Missing stake for address ${addr}`)
    err.address = addr
    throw err
  }
  let addrHasStake = false
  try {
    addrHasStake = await contract.hasStake(addr)
  } catch (err) {
    throw missingStake()
  }
  if (!addrHasStake) {
    throw missingStake()
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
