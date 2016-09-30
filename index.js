/**
 * Created by gabriel on 9/28/16.
 */

const BigNum = require('bignum');
const Chat = require('chat');
const util = require('util');
const EventEmitter = require('events');


/*
A Diffie Hellman secret negotiation channel
build on top of chat implementation

## Public methods
`DiffieHellman#negotiateSecret(dest, [cb])` = Starts a secret negotiation with the remote point,
                                        `dest` is the destiny host
                                        `cb` is called when the secret is build

## Events
`busy` = destiny is busy
`secret(secret, socket)` = when a secret is arrived

## Exemple
```javascript
const Dh = require('dh');

var dh = Dh();

dh.on('secret', function(secret, socket) {
  console.log('receiving new secret from ', socket.remoteAddress());
  console.log(secret.toString('hex'));
});

dh.negotiateSecret({host: '10.51.69.228'}, function(secret, err) {
  if (err) {
    console.log('10.51.69.228 is busy');
    return;
  }
  console.log('receiving new secret from 10.51.69.228');
  console.log(secret.toString('hex'));
});

```
 */


// q and g are generated with command
// `openssl dhparam -C 2048 -5` that generates a c code
// dh2048_p array in output is p
// dh2048_g array in output is g

const dhParams = {
    p: BigNum(  'E487FB5ED4FEC7EE7ACC67ADDFF33C4854E70344309CC8B26A4F8991CFE23BE6' +
                'E479545B7D17CF5D233E0B02F12A1F0441266CF324F26D861B6A1A6E153A5832' +
                'FD6C499018E64CCFD0F3DE9F5DACAA258FD6E5824231967762C706882A93D34B' +
                '7E39284C941B53D5A35BB96A2E1A732D5970CE67DC7D20ABAE0A2A6BC05A38AE' +
                '59280E4F158170F7168C9E902F6076725C0711B7F4E11797C4776A4DEE9B6630' +
                'F82D601B7390A875D508867E851E6F36AACCB801224ED0BE9C868FF393BDD6C4' +
                '705BE7D1198AB56DC69DFE099F9CFBD5752583231C2D7ED518079FD2FDEDF0EB' +
                'E23EBDBAB42F02EE27AA82B592152675077B83D347D7063B7BA8E0D78C0E2903', 16),
    g: BigNum(  '5', 16)
};

const defaults = {
    port: 4466
};

function DiffieHellman(options) {

    if (!(this instanceof DiffieHellman))
        return new DiffieHellman(options);

    options = Object.assign({}, defaults, options);

    EventEmitter.call(this, options);

    this.chat = Chat(options);
    this.chat.on('data', ondata.bind(this));
    this.chat.on('close', onclose.bind(this));
}

util.inherits(DiffieHellman, EventEmitter);

DiffieHellman.prototype.negotiateSecret = function (dest, cb) {

    if (this.negotiating)
        throw new Error('A negotiation already is in course');

    this.chat.connect(Object.assign({}, defaults, dest));

    if (typeof cb === 'function') {
        this.once('secret', function (data) {
            cb(data);
        });
        this.once('busy', function() {
            cb(undefined, Error('Busy destiny'));
        });
    }
    sendPublicKey(this);
};

function clearState(dh) {
    dh.x = undefined;
    dh.negotiating = false;
    dh.chat.disconnect();
}

function ondata(data, socket) {
    if (!this.negotiating) {
        sendPublicKey(this);
    }
    emitSecretEvent(this, data, socket);
}

function onclose() {
    if (this.negotiating) {
        this.emit('busy');
        clearState(this);
    }
}

function sendPublicKey(dh) {
    dh.negotiating = true;
    dh.x = BigNum(1).rand(dhParams.p);

    function sendKey() {
        dh.chat.write(dhParams.g.powm(dh.x, dhParams.p).toBuffer());
    }

    if (dh.chat.connected) {
        sendKey();
    } else {
        dh.chat.once('connect', sendKey);
    }
}

function emitSecretEvent(dh, data, socket) {
    // `y` is the external public key
    var y = BigNum.fromBuffer(data);
    dh.emit('secret', y.powm(dh.x, dhParams.p).toBuffer(), socket);
    clearState(dh);
}

module.exports = DiffieHellman;

