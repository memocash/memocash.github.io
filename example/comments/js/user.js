ExampleComments.User = {};

ExampleComments.User.InitWallet = function () {
    if (!localStorage.CommentsMnemonic) {
        localStorage.CommentsMnemonic = jmemo.Wallet.GenerateMnemonic();
    }
    jmemo.Client.SetHost(ExampleComments.Helper.GetBaseApiUrl());
};

/**
 * @returns {ECPair}
 */
ExampleComments.User.GetMainKey = function () {
    return jmemo.Wallet.GetHDChild(localStorage.CommentsMnemonic, jmemo.Wallet.Path.MainAddressPath());
};

/**
 * @returns {string}
 */
ExampleComments.User.GetMemoConnectUrl = function () {
    var mainAddress = ExampleComments.User.GetMainAddress();
    var host = ExampleComments.Helper.GetBaseMemoUrl();
    return host + "/account/link?" +
        "address=" + mainAddress +
        "&return_url=" + encodeURIComponent(document.location.href);
};

/**
 * @returns {string}
 */
ExampleComments.User.GetMainAddress = function () {
    return ExampleComments.User.GetMainKey().getAddress()
};

ExampleComments.User.ResetMnemonic = function () {
    if (!confirm("" +
        "Setting a new mnemonic will clear your current address and funds. " +
        "Verify you have backed up your mnemonic. " +
        "Are you sure you want to set a new mnemonic?")) {
        return;
    }
    var mnemonic = prompt("Enter mnemonic (leave blank to generate new)");
    if (!mnemonic.length) {
        mnemonic = jmemo.Wallet.GenerateMnemonic();
    }
    if (jmemo.Wallet.GetHDChild(mnemonic, jmemo.Wallet.Path.MainAddressPath()).getAddress().length) {
        localStorage.CommentsMnemonic = mnemonic;
        localStorage.ApiToken = "";
        localStorage.ApiSecret = "";
        ExampleComments.User.LoadFreshInfoModal();
    }
};

(function () {
    var showNeedsFunds = false;
    var showModalBannerType = "";
    var showModalBanner = "";
    var $userInfo;
    ExampleComments.User.InitInfo = function () {
        $userInfo = $("#user-info");
        $userInfo.click(function (e) {
            e.preventDefault();
            showModalBannerType = true;
            ExampleComments.User.GetInfo();
        });
        ExampleComments.User.GetInfo();
    };

    var tempKeyChecked = false;

    /**
     * @param {function=} cb
     */
    ExampleComments.User.GetInfo = function (cb) {
        var mainAddress = ExampleComments.User.GetMainAddress();
        jmemo.Client.Basic.Id(mainAddress, function (id) {
            /** @type {MemoApiId} ExampleComments.User.IdInfo */
            ExampleComments.User.IdInfo = id;
            $userInfo.html(ExampleComments.User.IdInfo.name || ExampleComments.Helper.ShortAddress(mainAddress));
            if (showModalBannerType !== "") {
                ExampleComments.User.LoadInfoModal(showModalBanner, showModalBannerType);
                showModalBannerType = "";
                showModalBanner = "";
            }
            if (!tempKeyChecked) {
                ExampleComments.API.CheckTempKey();
                tempKeyChecked = true;
            }
            if (showNeedsFunds) {
                ExampleComments.Modal.FundWallet();
                showNeedsFunds = false;
            }
            if (typeof cb == "function") {
                cb();
            }
        });
    };

    ExampleComments.User.ShowFundModalOrWait = function () {
        if (ExampleComments.User.ApiBalance) {
            ExampleComments.Modal.FundWallet();
        } else {
            var mainAddress = ExampleComments.User.GetMainAddress();
            jmemo.Client.Basic.BalanceWithToken(mainAddress, localStorage.ApiToken, localStorage.ApiSecret, function (apiBalance) {
                /** @type {MemoApiBalance} ExampleComments.User.ApiBalance */
                ExampleComments.User.ApiBalance = apiBalance;
                ExampleComments.Modal.FundWallet();
            });
        }
    };

    var MinApiBalance = 5000;
    var ApiFundAmount = 10000;
    var MinBalanceToFund = ApiFundAmount * 3;

    /**
     * @param {boolean} showModalAfterFund
     */
    ExampleComments.User.CheckApiBalance = function (showModalAfterFund) {
        if (!ExampleComments.User.ApiBalance || !ExampleComments.User.ApiBalance.api_address.length) {
            return;
        }
        if (!ExampleComments.User.AutoFundApi()) {
            return;
        }
        if (ExampleComments.User.ApiBalance.api_balance > MinApiBalance ||
            ExampleComments.User.ApiBalance.balance < MinBalanceToFund) {
            return;
        }
        jmemo.Client.Create.Send(localStorage.ApiToken, localStorage.ApiSecret, ExampleComments.User.ApiBalance.address, ExampleComments.User.ApiBalance.api_address, ApiFundAmount, "", ExampleComments.Tx.GetSignHandler(function () {
            if (showModalAfterFund) {
                ExampleComments.User.LoadFreshInfoModal();
            } else {
                ExampleComments.User.LoadBalance(false);
            }
        }))
    };

    /**
     * @returns {boolean}
     */
    ExampleComments.User.AutoFundApi = function () {
        return (localStorage.CommentsAutoFundApi && localStorage.CommentsAutoFundApi === "true") ||
            !localStorage.CommentsAutoFundApi;
    };

    ExampleComments.User.LoadFreshInfoModal = function () {
        ExampleComments.User.GetInfo(function () {
            ExampleComments.User.LoadInfoModal();
        });
    };

    /**
     * @param {string=} banner
     * @param {string=} bannerType
     */
    ExampleComments.User.LoadInfoModal = function (banner, bannerType) {
        if (!ExampleComments.User.IdInfo) {
            showModalBannerType = true;
            showModalBanner = banner;
            return;
        }
        var mainAddress = ExampleComments.User.GetMainAddress();
        var host = ExampleComments.Helper.GetBaseMemoUrl();
        var href = ExampleComments.User.GetMemoConnectUrl();
        var apiToken;
        if (localStorage.ApiToken) {
            apiToken = localStorage.ApiToken;
        }
        var linkMemoAccount, idAddress = "", setAlias = "";
        if (!ExampleComments.User.IdInfo.has_id || ExampleComments.User.IdInfo.revoked) {
            linkMemoAccount = "<a class='btn btn-success' href='" + href + "'>Connect Memo Account</a>";
        } else {
            if (!apiToken) {
                linkMemoAccount = "<a class='btn btn-success' href='" + href + "'>Connect Memo Account</a>";
            } else {
                setAlias = "<a id='set-alias-link' class='btn btn-default'>Set Alias</a> ";
                linkMemoAccount = "<a class='btn btn-success' href='" + href + "'>Add Funds</a>";
            }
            var idProfileLink = "<a href='" + host + "/profile/" + ExampleComments.User.IdInfo.address + "'>" + ExampleComments.User.IdInfo.address + "</a>";
            idAddress = ExampleComments.Template.InfoRow("user-info-id-address", "Id Address", idProfileLink, false, true);
        }
        var profileLink = "<a href='" + host + "/profile/" + mainAddress + "'>" + mainAddress + "</a>";
        if (banner && banner.length && bannerType && bannerType.length) {
            banner = "" +
                "<div class='alert alert-" + bannerType + "' role='alert'>" +
                "   <span class='glyphicon glyphicon-exclamation-sign'></span> " +
                banner +
                "</div>";
        } else if (ExampleComments.User.IdInfo.revoked) {
            banner = "" +
                "<div class='alert alert-danger' role='alert'>" +
                "   <span class='glyphicon glyphicon-exclamation-sign'></span> " +
                "Address is revoked. Try reconnecting." +
                "</div>";
        } else {
            banner = "";
        }
        var tooltip = "" +
            "<span id='mnemonic-info-tooltip' class='glyphicon glyphicon-info-sign' data-toggle='tooltip' data-placement='right' " +
            "title=\"(m/44'/0'/0')\"></span>";
        var text =
            banner +
            ExampleComments.Template.InfoRow("user-info-address", "Address", profileLink, false, true) +
            idAddress +
            ExampleComments.Template.InfoRow("user-info-mnemonic", "Mnemonic " + tooltip, localStorage.CommentsMnemonic, true) +
            (ExampleComments.User.IdInfo.alias ? ExampleComments.Template.InfoRow("user-info-alias", "Alias", ExampleComments.User.IdInfo.alias) : "") +
            ExampleComments.Template.InfoRow("user-info-balance", "Balance (satoshis)", "Loading...") +
            ExampleComments.Template.InfoRow("user-info-api-token", "API Token", "Loading...") +
            ExampleComments.Template.InfoRow("user-info-api-address", "API Address", "Loading...") +
            ExampleComments.Template.InfoRow("user-info-api-balance", "API Balance (satoshis)", "Loading...") +
            "<div class='form-group row'>" +
            "   <label for='auto-fund-api' class='col-form-label col-sm-3'>Auto-fund API</label>" +
            "   <div class='col-sm-9'>" +
            "       <input id='auto-fund-api' type='checkbox' name='auto-fund-api'/>" +
            "   </div>" +
            "</div>" +
            "<div class='form-group row'>" +
            "   <div class='col-sm-9 col-sm-offset-3'>" +
            linkMemoAccount +
            "       <input class='btn btn-primary' type='button' onclick='ExampleComments.Modal.CloseModal();' value='Close'/> " +
            setAlias +
            "       <input class='btn btn-default' type='button' onclick='ExampleComments.User.ResetMnemonic();' value='Reset mnemonic'/> " +
            "   </div>" +
            "</div>";
        ExampleComments.Modal.Main("User Info", text, 8, false);
        $("#mnemonic-info-tooltip").tooltip();
        var $autoFundApi = $("#auto-fund-api");
        $autoFundApi.change(function () {
            localStorage.CommentsAutoFundApi = $autoFundApi.is(":checked") ? "true" : "false";
        });
        if (ExampleComments.User.AutoFundApi()) {
            $autoFundApi.prop("checked", true);
        }
        if (setAlias !== "") {
            $("#set-alias-link").click(function (e) {
                e.preventDefault();
                var alias = "";
                if (ExampleComments.User.IdInfo) {
                    alias = ExampleComments.User.IdInfo.alias;
                }
                ExampleComments.Modal.Main("Set Alias", ExampleComments.Template.SetAliasForm(alias), 8, false);
                var $setAliasForm = $("#set-alias-form");
                $setAliasForm.submit(function () {
                    var alias = $setAliasForm.find("[name=alias]").val();
                    jmemo.Client.Create.Alias(localStorage.ApiToken, localStorage.ApiSecret, mainAddress, alias, ExampleComments.Tx.GetSignHandler(function () {
                        ExampleComments.User.LoadFreshInfoModal();
                        ExampleComments.Posts.Load();
                    }), function (error) {
                        alert("error setting alias: " + error);
                    });
                    return false;
                });
            })
        }
        var $userInfoBalance = $("#user-info-balance");
        var $userInfoApiToken = $("#user-info-api-token");
        var $userInfoApiBalance = $("#user-info-api-balance");
        var $userInfoApiAddress = $("#user-info-api-address");
        ExampleComments.User.LoadBalance(true, function () {
            $userInfoBalance.val(ExampleComments.Helper.WithCommas(ExampleComments.User.ApiBalance.balance));
            $userInfoApiToken.val(ExampleComments.User.ApiBalance.api_token || "Not connected yet");
            $userInfoApiBalance.val(ExampleComments.Helper.WithCommas(ExampleComments.User.ApiBalance.api_balance));
            $userInfoApiAddress.val(ExampleComments.User.ApiBalance.api_address || "Not connected yet");
        });
    };
    /**
     * @param {boolean} showModalAfterFund
     * @param {function=} done
     */
    ExampleComments.User.LoadBalance = function (showModalAfterFund, done) {
        var mainAddress = ExampleComments.User.GetMainAddress();
        /**
         * @param {MemoApiBalance} apiBalance
         */
        var successHandler = function (apiBalance) {
            /** @type {MemoApiBalance} ExampleComments.User.ApiBalance */
            ExampleComments.User.ApiBalance = apiBalance;
            ExampleComments.User.CheckApiBalance(showModalAfterFund);
            if (typeof done === "function") {
                done();
            }
        };
        jmemo.Client.Basic.BalanceWithToken(mainAddress, localStorage.ApiToken, localStorage.ApiSecret, successHandler, function (error) {
            if (error === 422) {
                jmemo.Client.Basic.Balance(mainAddress, successHandler, function (error) {
                    alert("Error getting user info: " + error);
                });
            } else {
                alert("Error getting user info: " + error);
            }
        });
    };
})();
