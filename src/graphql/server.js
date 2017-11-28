// @flow

import type { PSS } from 'erebos'
import debug from 'debug'
// $FlowFixMe
import { execute, subscribe } from 'graphql'
import type { Server } from 'https'
import { SubscriptionServer } from 'subscriptions-transport-ws'

import type DB from '../db'

import createSchema from './schema'

export default (pss: PSS, db: DB, port: number) => {
  const schema = createSchema(pss, db, port)
  const log = debug('onyx:graphql')

  return {
    schema,
    onCreated: (server: Server) => {
      SubscriptionServer.create(
        {
          execute,
          schema,
          subscribe,
          onConnect: (connectionParams, webSocket) => {
            log('ON CONNECT: ', webSocket)
          }
        },
        { path: '/graphql', server },
      )
    },
  }
}
