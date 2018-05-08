// @flow

import debug from 'debug'
import type { hex, PssAPI } from 'erebos'
import fetch from 'node-fetch'

import type DB from '../db'
import { addTopicPeers, joinChannel, updateChannelPeers } from '../pss/client'

export const CHAN_TOPIC = '0x1a508ad8'

const CHAN_SUBJECT = 'Welcome'
const KEYS_LIST_URL = 'https://summit-peers.herokuapp.com/swarm'

const dbg = debug('pss:summit')

const getPubKeys = async (addKey?: string) => {
  const res = addKey
    ? await fetch(`${KEYS_LIST_URL}/${addKey}`, { method: 'PUT' })
    : await fetch(KEYS_LIST_URL)
  if (!res.ok) {
    throw new Error(res.statusText || 'Error ' + res.statusCode)
  }
  const pubKeys = await res.json()
  return pubKeys
}

export const joinSummitChannel = async (pss: PssAPI, db: DB) => {
  const profile = db.getProfile()
  if (profile == null) {
    throw new Error('Profile must be setup')
  }

  const existing = db.getConversation(CHAN_TOPIC)
  if (existing != null) {
    // Topic already exists, retrieve list of peers and update
    const pubKeys = await getPubKeys()
    const peers = pubKeys.filter(pk => pk !== profile.id)
    await updateChannelPeers(pss, db, CHAN_TOPIC, peers)
    addTopicPeers(db, existing, peers)
    dbg('joined channel updated')
    return
  }

  // Add own public key and retrieve existing list
  const pubKeys = await getPubKeys(profile.id)
  dbg('got list of peers', pubKeys.length)

  // Join predefined channel with all existing peers
  await joinChannel(pss, db, {
    topic: CHAN_TOPIC,
    subject: 'Welcome',
    peers: pubKeys.map(pubKey => ({ address: '0x', pubKey })),
    dark: false,
  })
  dbg('joined shared channel')
}
