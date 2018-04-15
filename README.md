# Onyx Server

Mailboxing & data service for the [Onyx](https://github.com/MainframeHQ/onyx) app.

## Setting up an Onyx server on AWS

The easiest way to deploy this is with our automated AWS CloudFormation template.
To do this, just click on the link below.

![cloudformation-launch-button](images/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home#/stacks/new?stackName=OnyxServer&templateURL=https://s3-us-west-2.amazonaws.com/blockscale-cloudformation-templates-public/onyx-server.yaml)

### Fetch the certificates from the new AWS stack

In order to connect to the server, the client will need to use the right
certificates - otherwise the connection will be rejected. They are generated on
the server and you need to fetch them first. If you look at the outputs of your
AWS stack, one of them should be a link to the S3 bucket where your certs are
stored. Clicking the link will take you to a page where you can download those
from the AWS console.

The other output you will see listed is the URL you will use to connect your Onyx
client to the server. It should begin with *wss://*. Copy that and paste it into
your client on startup when it asks you for `Onyx server websocket url`. Then,
when prompted, select and upload the three cert/key files you just downloaded
from the AWS console. You are now connected!

## Prerequisites

[Node](https://nodejs.org/en/) v8+ with [npm](https://www.npmjs.com/).

## Installation

```sh
npm install --global onyx-server
```

## Usage

### CLI

```sh
onyx-server --port 5000 --http-url http://localhost:8500 --ws-url ws://localhost:8546
```

All arguments are optional, when not provided the server will use environment
variables `ONYX_PORT`, `SWARM_HTTP_URL` and `SWARM_WS_URL` or its defaults
(WebSocket on `ws://localhost:8546`, HTTP on `http://localhost:8500` and port
5000).

Additionally you can pass `-u` or `--unsecure` to dismiss using TLS, only recommended
for when connecting client and server over a local connection

The `DEBUG` environment variable can be used to activate logs, ex:

```sh
DEBUG="onyx*" onyx-server
```

### Connection security

The Onyx client connects to Onyx server using a WebSocket, and so uses TLS
certificates to authenticate and encrypt the connection. Use of client
certificates is enforced so that only your clients with the correct certificate
will be allowed to connect to the server, others are rejected. For mobile
clients, where it can be more difficult to handle cert files, the server allows
clients accessing the cert endpoint to download a password-encrypted p12 client
cert. For convenience, you can use the provided script to generate a set of
unique self-signed certificates.

```sh
./scripts/gen-certs.sh -p <certificate-password> -i <ip-address-to-certify> -d <domain-to-certify>
```

### Development

To build local version run `yarn start`. Afterwards you can start the built server
from `./bin/onyx-server`.

Onyx server depends on having a local swarm node running. You can start it by running
the `start_swarm_node.sh` script. This should allow you to run `onyx-server` with
no special arguments.

in one shell:
```sh
./scripts/start_swarm_node.sh <some_swarm_data_directory_here>
```

in another shell:
```sh
yarn start
./bin/onyx-server
```

### API

```js
import Conf from 'conf'
import startServer from 'onyx-server'

startServer({
  httpUrl: 'http://localhost:8500',
  wsUrl: 'ws://localhost:8546',
  port: 5000,
  store: new Conf(),
}).then(
  server => {
    console.log('server started')
  },
  err => {
    console.log('failed to start server', err)
  },
)
```

All parameters are optional, fallback values will be used for the parameters not
provided.

## License

MIT.\
See [LICENSE](LICENSE) file.
