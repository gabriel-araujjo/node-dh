# Node DH

A Diffie Hellman secret negotiation channel
build on top of [node-chat](https://github.com/gabriel-araujjo/node-chat) implementation

## Public methods
`DiffieHellman#negotiateSecret(dest, [cb])` = Starts a secret negotiation with the remote point,
                                        
* `dest` is the destiny host in format `{host: 'IP string', port: Number}`, port is optional
* `cb` is called when the secret is build

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

dh.neg({host: '10.51.69.228'}, function(secret, socket) {
 console.log('receiving new secret from ', socket.remoteAddress());
 console.log(secret.toString('hex'));
 });

dh.negotiateSecret();
```