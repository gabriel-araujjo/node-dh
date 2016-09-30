/**
 * Created by gabriel on 9/30/16.
 */

const Dh = require('./index');

var dhRemote = new Dh({port: 6644});
var dh = new Dh();

dh.negotiateSecret({port: 6644}, function (secret, err) {
    if (err) {
        console.log(err);
        return;
    }
    console.log(secret.toString('hex'));
});

