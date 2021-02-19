var ExampleParentKey = {
    Vars: {
        MainAddress: "",
        $apiToken: null,
        $apiBalance: null,
        $apiFundAddress: null,
        $addressBalance: null,
        $fundApiKeyLink: null,
        $fundApiKeyLinkSingle: null,
        $fundApiClear: null
    },
    Const: {
        WebHost: "https://beta.memo.cash",
        ApiHost: "https://beta-api.memo.cash"
    },
    /** @type {[MemoApiTx]} */
    Txs: {
        LinkRequest: null,
        LinkAccept: null,
        Post: null,
        TopicFollow: null,
        SendTokens: null,
        MuteUser: null,
        SendFunds: null
    },
    /**
     * @param {string} mainAddress
     * @param {jQuery} $apiToken
     * @param {jQuery} $apiBalance
     * @param {jQuery} $apiFundAddress
     * @param {jQuery} $addressBalance
     * @param {jQuery} $fundApiKeyLink
     * @param {jQuery} $fundApiKeyLinkSingle
     * @param {jQuery} $fundApiClear
     */
    Init: function (mainAddress, $apiToken, $apiBalance, $apiFundAddress, $addressBalance, $fundApiKeyLink, $fundApiKeyLinkSingle, $fundApiClear) {
        ExampleParentKey.Vars.MainAddress = mainAddress;
        ExampleParentKey.Vars.$apiToken = $apiToken;
        ExampleParentKey.Vars.$apiBalance = $apiBalance;
        ExampleParentKey.Vars.$apiFundAddress = $apiFundAddress;
        ExampleParentKey.Vars.$addressBalance = $addressBalance;
        ExampleParentKey.Vars.$fundApiKeyLink = $fundApiKeyLink;
        ExampleParentKey.Vars.$fundApiKeyLinkSingle = $fundApiKeyLinkSingle;
        ExampleParentKey.Vars.$fundApiClear = $fundApiClear;
        jmemo.Client.SetHost(ExampleParentKey.GetBaseApiUrl());
        $fundApiKeyLink.attr("href", ExampleParentKey.GetMemoConnectUrl(mainAddress));
        if (localStorage.ParentKeyApiToken) {
            ExampleParentKey.UpdateApiBalance();
        } else {
            ExampleParentKey.UpdateApiBalanceNoToken();
        }
        ExampleParentKey.Vars.$fundApiClear.click(function (e) {
            e.preventDefault();
            delete (localStorage.ParentKeyApiToken);
            delete (localStorage.ParentKeyApiSecret);
            ExampleParentKey.ApiTokenNotSet();
        });
        ExampleParentKey.Vars.$fundApiKeyLinkSingle.click(function (e) {
            e.preventDefault();
            jmemo.Client.Api.Key.New(ExampleParentKey.HandleApiKeyResponse, function (error) {
                alert(error);
            });
        });
        var urlParams = new URLSearchParams(window.location.search);
        var apiToken = urlParams.get("api_token");
        var apiTempKey = urlParams.get("api_temp_key");
        if (!apiTempKey || !apiToken || !apiTempKey.length || !apiToken.length) {
            // Other params
            ExampleParentKey.RemoveUrlParams();
            return;
        }

        jmemo.Client.Api.Key.Get(apiToken, apiTempKey, ExampleParentKey.HandleApiKeyResponse, function (error) {
            alert(error);
        });
    },
    /**
     * @param {MemoApiSecret} apiSecret
     */
    HandleApiKeyResponse: function (apiSecret) {
        localStorage.ParentKeyApiToken = apiSecret.token;
        localStorage.ParentKeyApiSecret = apiSecret.secret;
        if (!ExampleParentKey.RemoveUrlParams()) {
            location.reload();
        }
    },
    /**
     * @returns {boolean}
     */
    RemoveUrlParams: function () {
        if (location.href.indexOf("?") !== -1) {
            location.href = location.href.split("?")[0];
            return true;
        }
        return false;
    },
    UpdateApiBalance: function () {
        jmemo.Client.Basic.BalanceWithToken(ExampleParentKey.Vars.MainAddress, localStorage.ParentKeyApiToken,
            localStorage.ParentKeyApiSecret, ExampleParentKey.ApiBalanceHandler, function (e) {
                if (e === 422) {
                    jmemo.Client.Basic.Balance(ExampleParentKey.Vars.MainAddress, ExampleParentKey.ApiBalanceHandler);
                } else {
                    alert("Error getting balance: " + e);
                }
            });
    },
    UpdateApiBalanceNoToken: function () {
        jmemo.Client.Basic.Balance(ExampleParentKey.Vars.MainAddress, ExampleParentKey.ApiBalanceHandler);
    },
    /**
     * @param {MemoApiBalance} apiBalance
     */
    ApiBalanceHandler: function (apiBalance) {
        ExampleParentKey.ApiBalance = apiBalance;
        ExampleParentKey.Vars.$addressBalance.val(apiBalance.balance);
        if (apiBalance.api_token) {
            ExampleParentKey.Vars.$apiToken.val(apiBalance.api_token);
            ExampleParentKey.Vars.$apiBalance.val(apiBalance.api_balance);
            ExampleParentKey.Vars.$apiFundAddress.val(apiBalance.api_address);
            ExampleParentKey.Vars.$fundApiKeyLink.text("Add Funds").removeClass("btn-success").addClass("btn-primary");
            ExampleParentKey.Vars.$fundApiKeyLinkSingle.addClass("hidden");
            ExampleParentKey.Vars.$fundApiClear.removeClass("hidden");
        } else {
            ExampleParentKey.ApiTokenNotSet();
        }
    },
    ApiTokenNotSet: function () {
        ExampleParentKey.Vars.$apiToken.val("Not set");
        ExampleParentKey.Vars.$apiBalance.val(0);
        ExampleParentKey.Vars.$apiToken.val("Not set");
        ExampleParentKey.Vars.$apiBalance.parents(".row").addClass("hidden");
        ExampleParentKey.Vars.$apiFundAddress.parents(".row").addClass("hidden");
        ExampleParentKey.Vars.$fundApiKeyLink.text("Get API Token (w/ Memo)").removeClass("btn-primary").addClass("btn-success");
        ExampleParentKey.Vars.$fundApiKeyLinkSingle.removeClass("hidden");
        ExampleParentKey.Vars.$fundApiClear.addClass("hidden");
    },
    /**
     * @returns {string}
     */
    GetBaseMemoUrl: function () {
        if (localStorage.WebHost) {
            return localStorage.WebHost;
        }
        return ExampleParentKey.Const.WebHost;
    },
    /**
     * @returns {string}
     */
    GetBaseApiUrl: function () {
        if (localStorage.ApiHost) {
            return localStorage.ApiHost;
        }
        return ExampleParentKey.Const.ApiHost;
    },
    /**
     * @param {string} address
     * @returns {string}
     */
    GetMemoConnectUrl: function (address) {
        var host = ExampleParentKey.GetBaseMemoUrl();
        return host + "/account/link?" +
            "address=" + address +
            "&return_url=" + encodeURIComponent(document.location.href);
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $mnemonic
     * @param {jQuery} $mainAddress
     * @param {jQuery} $slpAddress
     */
    SetMnemonic: function ($form, $mnemonic, $mainAddress, $slpAddress) {
        var mnemonic;
        $form.submit(function (e) {
            e.preventDefault();
            if (!confirm("Are you sure you want to clear the existing mnemonic and set a new one?")) {
                return;
            }
            resetMnemonic();
            displayMnemonic();
        });
        $mnemonic.on("input", function () {
            setAddress();
        });

        if (!localStorage.ParentKeyMnemonic) {
            resetMnemonic();
        }
        displayMnemonic();

        function setAddress() {
            mnemonic = $mnemonic.val();
            if (!mnemonic) {
                return;
            }
            var mainAddressPath = jmemo.Wallet.Path.GetPath(jmemo.Wallet.Path.CoinType.BTC, jmemo.Wallet.Path.DefaultAccount, 0);
            if (mainAddressPath) {
                var mainKey = jmemo.Wallet.GetHDChild(mnemonic, mainAddressPath);
                var mainAddress = mainKey.getAddress();
                $mainAddress.val(mainAddress);
            }
            var slpAddressPath = jmemo.Wallet.Path.GetPath(jmemo.Wallet.Path.CoinType.SLP, jmemo.Wallet.Path.DefaultAccount, 0);
            if (slpAddressPath) {
                var slpKey = jmemo.Wallet.GetHDChild(mnemonic, slpAddressPath);
                var slpAddress = slpKey.getAddress();
                $slpAddress.val(slpAddress);
            }
        }

        function resetMnemonic() {
            localStorage.ParentKeyMnemonic = jmemo.Wallet.GenerateMnemonic();
        }

        function displayMnemonic() {
            if (localStorage.ParentKeyMnemonic) {
                $mnemonic.val(localStorage.ParentKeyMnemonic);
                setAddress();
            }
        }
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $address
     * @param {jQuery} $linkRequestTxHash
     * @param {jQuery} $linkRequestAddress
     * @param {jQuery} $linkRequestMessage
     */
    CheckLinkRequest: function ($form, $address, $linkRequestTxHash, $linkRequestAddress, $linkRequestMessage) {
        $form.submit(function (e) {
            e.preventDefault();
            jmemo.Client.Link.CheckRequest($address.val(), function (requestCheck) {
                if (!requestCheck || !requestCheck.length || !requestCheck[0].tx_hash) {
                    alert("No link request found");
                    return;
                }
                $linkRequestTxHash.val(requestCheck[0].tx_hash);
                $linkRequestAddress.val(requestCheck[0].child_address);
                $linkRequestMessage.val(requestCheck[0].message);
            }, function (err) {
                console.log(err);
            });
        });
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $linkRequestTxHash
     * @param {jQuery} $acceptUnsignedRaw
     */
    CreateLinkAccept: function ($form, $linkRequestTxHash, $acceptUnsignedRaw) {
        $form.submit(function (e) {
            e.preventDefault();
            var linkRequestTxHash = $linkRequestTxHash.val();
            if (!linkRequestTxHash) {
                alert("link request tx hash not set");
                return;
            }
            if (!localStorage.ParentKeyApiToken) {
                alert("api token not set");
                return;
            }
            jmemo.Client.Link.CreateAccept(localStorage.ParentKeyApiToken, localStorage.ParentKeyApiSecret, linkRequestTxHash, function (apiTx) {
                ExampleParentKey.Txs.LinkAccept = apiTx;
                $acceptUnsignedRaw.val(apiTx.raw);
                ExampleParentKey.UpdateApiBalance();
            }, ExampleParentKey.TxErrorHandler);
        });
    },
    TxErrorHandler: function (err) {
        var additionalErrorMessage = "";
        if (err === 402) {
            additionalErrorMessage = " Not enough balance or api balance.";
        }
        alert("Error creating transaction." + additionalErrorMessage + " Verify API token is set and has enough funds. Error: " + err);
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $mnemonic
     * @param {jQuery} $acceptUnsignedRaw
     * @param {jQuery} $acceptSignedRaw
     */
    SignAccept: function ($form, $mnemonic, $acceptUnsignedRaw, $acceptSignedRaw) {
        $form.submit(function (e) {
            e.preventDefault();
            var linkAcceptRaw = $acceptUnsignedRaw.val();
            if (!linkAcceptRaw) {
                alert("link accept raw not set");
                return;
            }
            var mnemonic = $mnemonic.val();
            if (!mnemonic) {
                alert("mnemonic not set");
                return;
            }
            var mainAddressPath = jmemo.Wallet.Path.GetPath(jmemo.Wallet.Path.CoinType.BTC, jmemo.Wallet.Path.DefaultAccount, 0);
            if (!mainAddressPath) {
                alert("error getting main address path");
            }
            var mainKey = jmemo.Wallet.GetHDChild(mnemonic, mainAddressPath);
            var signedTx = jmemo.Wallet.Sign.SignTx({
                raw: linkAcceptRaw,
                ins: ExampleParentKey.Txs.LinkAccept.ins
            }, mainKey);
            $acceptSignedRaw.val(signedTx.toHex());
        });
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $acceptSignedRaw
     */
    BroadcastSigned: function ($form, $acceptSignedRaw) {
        $form.submit(function (e) {
            e.preventDefault();
            var linkAcceptSignedRaw = $acceptSignedRaw.val();
            if (!linkAcceptSignedRaw) {
                alert("link accept signed raw not set");
                return;
            }
            jmemo.Client.Tx.Broadcast(linkAcceptSignedRaw, function (response) {
                console.log("Successfully broadcast!");
                console.log(response);
                ExampleParentKey.UpdateApiBalance();
            }, function (err) {
                console.log("Error broadcasting");
                console.log(err);
            });
        });
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $address
     * @param {jQuery} $message
     * @param {jQuery} $postUnsignedRaw
     */
    CreatePost: function ($form, $address, $message, $postUnsignedRaw) {
        $form.submit(function (e) {
            e.preventDefault();
            var message = $message.val();
            if (!message || message.length < 1) {
                alert("message not set");
                return;
            }
            var address = $address.val();
            if (!address || address.length < 1) {
                alert("address not set");
                return;
            }
            if (!localStorage.ParentKeyApiToken || !localStorage.ParentKeyApiSecret) {
                alert("api token not set");
                return;
            }
            jmemo.Client.Create.Post(localStorage.ParentKeyApiToken, localStorage.ParentKeyApiSecret, address, message, function (apiTx) {
                ExampleParentKey.Txs.Post = apiTx;
                $postUnsignedRaw.val(apiTx.raw);
                ExampleParentKey.UpdateApiBalance();
            }, ExampleParentKey.TxErrorHandler);
        });
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $mnemonic
     * @param {jQuery} $unsignedRaw
     * @param {jQuery} $signedRaw
     * @param {string} txName
     */
    SignTxForm: function ($form, $mnemonic, $unsignedRaw, $signedRaw, txName) {
        $form.submit(function (e) {
            e.preventDefault();
            var unsignedRaw = $unsignedRaw.val();
            if (!unsignedRaw) {
                alert("unsigned raw not set");
                return;
            }
            var mnemonic = $mnemonic.val();
            if (!mnemonic) {
                alert("mnemonic not set");
                return;
            }
            var mainAddressPath = jmemo.Wallet.Path.GetPath(jmemo.Wallet.Path.CoinType.BTC, jmemo.Wallet.Path.DefaultAccount, 0);
            if (!mainAddressPath) {
                alert("error getting main address path");
            }
            var mainKey = jmemo.Wallet.GetHDChild(mnemonic, mainAddressPath);
            var signedTx = jmemo.Wallet.Sign.SignTx({
                raw: unsignedRaw,
                ins: ExampleParentKey.Txs[txName].ins
            }, mainKey);
            $signedRaw.val(signedTx.toHex());
        });
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $address
     * @param {jQuery} $parentAddress
     * @param {jQuery} $message
     * @param {jQuery} $unsignedRaw
     */
    CreateLinkRequest: function ($form, $address, $parentAddress, $message, $unsignedRaw) {
        $form.submit(function (e) {
            e.preventDefault();
            var address = $address.val();
            if (!address || address.length < 1) {
                alert("address not set");
                return;
            }
            var parentAddress = $parentAddress.val();
            if (!parentAddress) {
                alert("link request parent address not set");
                return;
            }
            var linkRequestMessage = $message.val();
            if (!localStorage.ParentKeyApiToken) {
                alert("api token not set");
                return;
            }
            jmemo.Client.Link.CreateRequest(localStorage.ParentKeyApiToken, localStorage.ParentKeyApiSecret, address, parentAddress, linkRequestMessage, function (apiTx) {
                ExampleParentKey.Txs.LinkRequest = apiTx;
                $unsignedRaw.val(apiTx.raw);
                ExampleParentKey.UpdateApiBalance();
            }, ExampleParentKey.TxErrorHandler);
        });
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $address
     * @param {jQuery} $topic
     * @param {jQuery} $unfollow
     * @param {jQuery} $unsignedRaw
     */
    CreateTopicFollow: function ($form, $address, $topic, $unfollow, $unsignedRaw) {
        $form.submit(function (e) {
            e.preventDefault();
            var address = $address.val();
            if (!address || address.length < 1) {
                alert("address not set");
                return;
            }
            var topic = $topic.val();
            if (!topic || topic.length < 1) {
                alert("topic not set");
                return;
            }
            var unfollow = $unfollow.filter(":checked").length > 0;
            if (!localStorage.ParentKeyApiToken) {
                alert("api token not set");
                return;
            }
            jmemo.Client.Topic.CreateFollow(localStorage.ParentKeyApiToken, localStorage.ParentKeyApiSecret, address, topic, unfollow, function (apiTx) {
                ExampleParentKey.Txs.TopicFollow = apiTx;
                $unsignedRaw.val(apiTx.raw);
                ExampleParentKey.UpdateApiBalance();
            }, ExampleParentKey.TxErrorHandler);
        });
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $address
     * @param {jQuery} $token
     * @param {jQuery} $recipient
     * @param {jQuery} $quantity
     * @param {jQuery} $unsignedRaw
     */
    CreateSendTokens: function ($form, $address, $token, $recipient, $quantity, $unsignedRaw) {
        $form.submit(function (e) {
            e.preventDefault();
            var address = $address.val();
            if (!address || address.length < 1) {
                alert("address not set");
                return;
            }
            var recipient = $recipient.val();
            if (!recipient || recipient.length < 1) {
                alert("recipient not set");
                return;
            }
            var token = $token.val();
            if (!token || token.length < 1) {
                alert("token not set");
                return;
            }
            var quantity = $quantity.val();
            if (!localStorage.ParentKeyApiToken) {
                alert("api token not set");
                return;
            }
            jmemo.Client.Token.CreateSend(localStorage.ParentKeyApiToken, localStorage.ParentKeyApiSecret, address, token, recipient, quantity, function (apiTx) {
                ExampleParentKey.Txs.SendTokens = apiTx;
                $unsignedRaw.val(apiTx.raw);
                ExampleParentKey.UpdateApiBalance();
            }, ExampleParentKey.TxErrorHandler);
        });
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $address
     * @param {jQuery} $muteAddress
     * @param {jQuery} $unmute
     * @param {jQuery} $unsignedRaw
     */
    CreateMuteUser: function ($form, $address, $muteAddress, $unmute, $unsignedRaw) {
        $form.submit(function (e) {
            e.preventDefault();
            var address = $address.val();
            if (!address || address.length < 1) {
                alert("address not set");
                return;
            }
            var muteAddress = $muteAddress.val();
            if (!muteAddress || muteAddress.length < 1) {
                alert("mute address not set");
                return;
            }
            var unmute = $unmute.filter(":checked").length > 0;
            if (!localStorage.ParentKeyApiToken) {
                alert("api token not set");
                return;
            }
            jmemo.Client.Create.Mute(localStorage.ParentKeyApiToken, localStorage.ParentKeyApiSecret, address, muteAddress, unmute, function (apiTx) {
                ExampleParentKey.Txs.MuteUser = apiTx;
                $unsignedRaw.val(apiTx.raw);
                ExampleParentKey.UpdateApiBalance();
            }, ExampleParentKey.TxErrorHandler);
        });
    },
    /**
     * @param {jQuery} $form
     * @param {jQuery} $address
     * @param {jQuery} $recipient
     * @param {jQuery} $quantity
     * @param {jQuery} $unsignedRaw
     */
    CreateSendFunds: function ($form, $address, $recipient, $quantity, $unsignedRaw) {
        $form.submit(function (e) {
            e.preventDefault();
            var address = $address.val();
            if (!address || address.length < 1) {
                alert("address not set");
                return;
            }
            var recipient = $recipient.val();
            if (!recipient || recipient.length < 1) {
                alert("recipient not set");
                return;
            }
            var quantity = $quantity.val();
            if (!localStorage.ParentKeyApiToken) {
                alert("api token not set");
                return;
            }
            jmemo.Client.Create.Send(localStorage.ParentKeyApiToken, localStorage.ParentKeyApiSecret, address, recipient, quantity, "", function (apiTx) {
                ExampleParentKey.Txs.SendFunds = apiTx;
                $unsignedRaw.val(apiTx.raw);
                ExampleParentKey.UpdateApiBalance();
            }, ExampleParentKey.TxErrorHandler);
        });
    },
    /**
     * @param {jQuery} $getApiHistoryFundsForm
     * @param {jQuery} $apiHistoryOutput
     */
    GetApiHistoryFunds: function ($getApiHistoryFundsForm, $apiHistoryOutput) {
        $getApiHistoryFundsForm.submit(function (e) {
            e.preventDefault();
            var offset = $getApiHistoryFundsForm.find("[name=offset]").val();
            if (!localStorage.ParentKeyApiToken) {
                alert("api token not set");
                return;
            }
            jmemo.Client.Api.History.Funds(localStorage.ParentKeyApiToken, localStorage.ParentKeyApiSecret, offset, function (fundHistory) {
                var html = "" +
                    "<div class='row row-striped'>" +
                    "<div class='col-xs-6'>Tx Hash</div>" +
                    "<div class='col-xs-3'>Amount</div>" +
                    "<div class='col-xs-3'>Date</div>" +
                    "</div>";
                for (var i = 0; i < fundHistory.length; i++) {
                    html += "" +
                        "<div class='row row-striped'>" +
                        "<div class='col-xs-6'>" +
                        "   <a href='" + ExampleParentKey.GetBaseMemoUrl() + "/explore/tx/" + fundHistory[i].tx_hash + "'>" +
                        ExampleParentKey.ShortHash(fundHistory[i].tx_hash) +
                        "   </a>" +
                        "</div>" +
                        "<div class='col-xs-3'>" + fundHistory[i].amount + "</div>" +
                        "<div class='col-xs-3'>" + fundHistory[i].date + "</div>" +
                        "</div>"
                }
                $apiHistoryOutput.html(html);
            }, function (error) {
                console.log(error);
            });
        });
    },
    /**
     * @param {jQuery} $getApiHistorySpendsForm
     * @param {jQuery} $apiHistoryOutput
     */
    GetApiHistorySpends: function ($getApiHistorySpendsForm, $apiHistoryOutput) {
        $getApiHistorySpendsForm.submit(function (e) {
            e.preventDefault();
            var offset = $getApiHistorySpendsForm.find("[name=offset]").val();
            if (!localStorage.ParentKeyApiToken) {
                alert("api token not set");
                return;
            }
            jmemo.Client.Api.History.Spends(localStorage.ParentKeyApiToken, localStorage.ParentKeyApiSecret, offset, function (spendHistory) {
                var html = "" +
                    "<div class='row row-striped'>" +
                    "<div class='col-xs-6'>Tx Hash</div>" +
                    "<div class='col-xs-3'>Amount</div>" +
                    "<div class='col-xs-3'>Date</div>" +
                    "</div>";
                for (var i = 0; i < spendHistory.length; i++) {
                    html += "" +
                        "<div class='row row-striped'>" +
                        "<div class='col-xs-6'>" +
                        "   <a href='" + ExampleParentKey.GetBaseMemoUrl() + "/explore/tx/" + spendHistory[i].tx_hash + "'>" +
                        ExampleParentKey.ShortHash(spendHistory[i].tx_hash) +
                        "   </a>" +
                        "</div>" +
                        "<div class='col-xs-3'>" + spendHistory[i].amount + "</div>" +
                        "<div class='col-xs-3'>" + spendHistory[i].date + "</div>" +
                        "</div>"
                }
                $apiHistoryOutput.html(html);
            }, function (error) {
                console.log(error);
            });
        });
    },
    /**
     * @param {string} hash
     * @returns {string}
     */
    ShortHash: function (hash) {
        if (hash.length < 16) {
            return hash;
        }
        return hash.substr(0, 8) + "..." + hash.substr(-8);
    }
};
