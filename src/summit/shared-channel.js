// @flow

import debug from 'debug'
import type { hex, PssAPI } from 'erebos'
import fetch from 'node-fetch'

import type DB from '../db'
import { addTopicPeers, joinChannel } from '../pss/client'

export const CHAN_TOPIC = '0x1a508ad8'

const CHAN_SUBJECT = 'Welcome'
const KEYS_LIST_URL = 'https://summit-peers.herokuapp.com/swarm/'

const dbg = debug('pss:summit')

const getPubKeys = async (addKey: string) => {
  const res = await fetch(KEYS_LIST_URL + addKey, { method: 'PUT' })
  if (!res.ok) {
    throw new Error(res.statusText || 'Error ' + res.statusCode)
  }
  const pubKeys = await res.json()
  return pubKeys
}

export const joinSummitChannel = async (pss: PssAPI, db: DB) => {
  const existing = db.getConversation(CHAN_TOPIC)
  if (existing != null) {
    dbg('topic exists')
    return
  }

  const profile = db.getProfile()
  if (profile == null) {
    throw new Error('Profile must be setup')
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
