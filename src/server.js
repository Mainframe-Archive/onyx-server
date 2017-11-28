// @flow

import debug from 'debug'
import type { PSS } from 'erebos'
import bodyParser from 'body-parser'
import https from 'https'
import fs from 'fs'
import express from 'express'
import { graphiqlExpress, graphqlExpress } from 'apollo-server-express'

import type DB from './db'
import createBzzRoutes from './bzz'
import graphqlServer from './graphql/server'

export default (
  pss: PSS,
  db: DB,
  httpUrl: string,
  port: number,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const log = debug('onyx:server')
    const bzzRoutes = createBzzRoutes(httpUrl)
    const graphql = graphqlServer(pss, db, port)

    const options: { [string]: any } = {
      requestCert: true,
      rejectUnauthorized: true,
    }

    try {
      options.key = fs.readFileSync('./certs/server-key.pem')
      options.cert = fs.readFileSync('./certs/server-crt.pem')
      options.ca = fs.readFileSync('./certs/ca-crt.pem')
    } catch (err) {
      console.warn(
        `error reading ssl certificates, please make sure to run the certificate generation script.\n ${err}`
      )
      throw err
    }

    const app = express()

    app.use('/graphql', bodyParser.json(), graphqlExpress({ schema: graphql.schema }))
    app.use('/graphiql', graphiqlExpress({
      endpointURL: '/graphql',
    }))

    const websocketServer = https.createServer(options, app)

    websocketServer.listen(port, 'localhost', (err) =>  {
      if (err) {
        reject(err)
      } else {
        log(`running on port ${port}`)
        graphql.onCreated(websocketServer)
        resolve()
      }
    })
  })
}
