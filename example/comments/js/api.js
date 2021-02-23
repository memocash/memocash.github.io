ExampleComments.API = {};

(function () {
    ExampleComments.API.CheckTempKey = function () {
        var urlParams = new URLSearchParams(window.location.search);
        var apiToken = urlParams.get("api_token");
        var apiTempKey = urlParams.get("api_temp_key");
        var parentAddress = urlParams.get("parent_address");
        var message;
        if (localStorage.LinkSuccess) {
            message = localStorage.LinkSuccess;
            delete (localStorage.LinkSuccess);
            $(function () {
                ExampleComments.User.LoadInfoModal(message, "success");
            });
        }
        if (localStorage.LinkWarning) {
            message = localStorage.LinkWarning;
            delete (localStorage.LinkWarning);
            $(function () {
                ExampleComments.User.LoadInfoModal(message, "warning");
            });
        }
        if (localStorage.NeedFunding) {
            delete (localStorage.NeedFunding);
            $(function () {
                ExampleComments.User.ShowFundModalOrWait();
            });
        }
        if (!apiTempKey || !parentAddress || !apiTempKey.length || !parentAddress.length) {
            if (location.href.indexOf("?") !== -1) {
                // Other params
                location.href = location.href.split("?")[0];
            }
            return;
        }
        var tempKeyCheck = new CommentsTempKeyCheck(apiToken, apiTempKey, ExampleComments.User.GetMainAddress(), parentAddress);
        var errCb = function (err) {
            if (err === 402) {
                localStorage.NeedFunding = true;
            } else {
                alert("error temp key check: " + err);
            }
            // Error
            location.href = location.href.split("?")[0];
        };
        tempKeyCheck.GetKey(function () {
            if (ExampleComments.User.IdInfo.parent && ExampleComments.User.IdInfo.parent.length
                && tempKeyCheck.parentAddress !== ExampleComments.User.IdInfo.parent) {
                // Different key, don't try to connect
                if (ExampleComments.User.IdInfo.revoked) {
                    localStorage.LinkWarning = "Account revoked and using API key for different parent";
                } else {
                    localStorage.LinkWarning = "Using API key for different parent";
                }
                location.href = location.href.split("?")[0];
                return;
            }
            if (ExampleComments.User.IdInfo.has_id && !ExampleComments.User.IdInfo.revoked) {
                // Already connected
                localStorage.LinkSuccess = "Successfully connected!";
                location.href = location.href.split("?")[0];
                return;
            }
            var text = "" +
                "<p>" +
                "Please wait. " +
                "This process may take awhile. " +
                "Refreshing the page will interrupt the process." +
                "</p>" +
                "<p class='loading'>" +
                "<span class='glyphicon glyphicon-refresh spinning'></span>" +
                "</p>";
            ExampleComments.Modal.Main("Connecting Account...", text, 8, false);
            tempKeyCheck.LinkRequest(function () {
                tempKeyCheck.FinishAccept(function () {
                    // After connection
                    localStorage.LinkSuccess = "Successfully created new connection";
                    location.href = location.href.split("?")[0];
                }, errCb);
            }, errCb);
        }, errCb);
    };
})();

/**
 * @param {string} apiToken
 * @param {string} apiTempKey
 * @param {string} address
 * @param {string} parentAddress
 * @constructor
 */
function CommentsTempKeyCheck(apiToken, apiTempKey, address, parentAddress) {
    this.apiToken = apiToken;
    this.apiTempKey = apiTempKey;
    this.address = address;
    this.parentAddress = parentAddress;
}

/**
 * @param {function} done
 * @param {function(number)=} errCb
 */
CommentsTempKeyCheck.prototype.GetKey = function (done, errCb) {
    var self = this;
    jmemo.Client.Api.Key.Get(this.apiToken, this.apiTempKey, function (apiSecret) {
        localStorage.ApiToken = apiSecret.token;
        localStorage.ApiSecret = self.apiSecret = apiSecret.secret;
        done();
    }, errCb);
};

/**
 * @param {function} done
 * @param {function(number)=} errCb
 */
CommentsTempKeyCheck.prototype.LinkRequest = function (done, errCb) {
    var self = this;
    if (!localStorage.ApiToken) {
        alert("Error API token not set. Please try again.");
        return;
    }
    jmemo.Client.Link.CreateRequest(localStorage.ApiToken, localStorage.ApiSecret, this.address, this.parentAddress,
        "jMemo Comments Example", function (apiTx) {
            var key = ExampleComments.User.GetMainKey();
            var signedTx = jmemo.Wallet.Sign.SignTx(apiTx, key);
            self.requestTxHash = jmemo.Wallet.Util.GetTxRawHash(signedTx.toHex());
            jmemo.Client.Tx.BroadcastAndWait(signedTx.toHex(), done, errCb);
        }, errCb);
};

/**
 * @param {function} done
 * @param {function(number)=} errCb
 */
CommentsTempKeyCheck.prototype.FinishAccept = function (done, errCb) {
    var self = this;
    jmemo.Client.Link.FinishAccept(this.apiToken, this.apiTempKey, this.requestTxHash, function (apiTx) {
        self.acceptTxHash = apiTx.hash;
        jmemo.Client.Tx.BroadcastAndWait(apiTx.raw, done, errCb);
    }, errCb);
};
