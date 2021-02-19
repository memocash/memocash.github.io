ExampleComments.Tx = {};

/**
 * @param {function(MemoApiTx)=} cb
 * @param {function(number)=} errCb
 * @returns {function(...[*]=)}
 */
ExampleComments.Tx.GetSignHandler = function (cb, errCb) {
    return function (apiTx) {
        var key = ExampleComments.User.GetMainKey();
        var signedTx = jmemo.Wallet.Sign.SignTx(apiTx, key);
        jmemo.Client.Tx.BroadcastAndWait(signedTx.toHex(), function (response) {
            if (typeof cb == "function") {
                cb(apiTx);
            } else {
                console.log(response);
            }
        }, function (err) {
            if (typeof errCb == "function") {
                errCb(err);
            } else {
                console.log("error with sign handler: " + err);
            }
        });
    }
};
