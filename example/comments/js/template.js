ExampleComments.Template = {};

/**
 * @param {string} html
 * @returns string
 */
ExampleComments.Template.Clean = function (html) {
    return $($.parseHTML(html)).text();
}

/**
 * @param {string} id
 * @param {string} name
 * @param {string} value
 * @param {boolean=} hide
 * @param {boolean=} justValue
 * @returns string
 */
ExampleComments.Template.InfoRow = function (id, name, value, hide, justValue) {
    var hideText = "";
    if (hide) {
        hideText = "" +
            "<a id='show-" + id + "'>Show</a>" +
            "<script>" +
            "$('#show-" + id + "').click(function(e) {" +
            "   e.preventDefault();" +
            "   $('#" + id + "').removeClass('hidden');" +
            "   $('#show-" + id + "').addClass('hidden');" +
            "});" +
            "</script>";
    }
    return "" +
        "<div class='form-group row'>" +
        "   <label for='" + id + "' class='col-form-label col-sm-3'>" +
        name +
        "   </label>" +
        "   <div class='col-sm-9'>" +
        (justValue ? value :
            "   <input id='" + id + "' class='form-control" + (hide ? " hidden" : "") + "' type='text' " +
            "       value='" + value + "' readonly/>") +
        hideText +
        "   </div>" +
        "</div>";
};

/**
 * @param {MemoApiPost} post
 * @returns string
 */
ExampleComments.Template.Post = function (post) {
    var name = ExampleComments.Template.Clean(post.name.name);
    var alias = ExampleComments.Template.Clean(post.name.alias);
    return "" +
        "<div class='panel panel-default'>" +
        "  <div class='panel-heading'>" +
        "    <a href='" + ExampleComments.Helper.GetBaseMemoUrl() + "/profile/" + post.name.address + "'>" +
        (name.length ? name : post.name.address) +
        (alias.length ? " <span class='alias'>(" + alias + ")</span>" : "") +
        "    </a>" +
        " on " +
        "    <a href='" + ExampleComments.Helper.GetBaseMemoUrl() + "/post/" + post.tx_hash + "'>" +
        post.date +
        "    </a>" +
        " &nbsp;&middot;&nbsp; " +
        post.likes + " <span class='glyphicon glyphicon-heart'></span> &nbsp;" +
        ExampleComments.Helper.WithCommas(post.tip) + " <span class='glyphicon glyphicon-bitcoin'></span> " +
        " &nbsp;&middot;&nbsp; " +
        "    <form class='inline like-form' id='like-form-" + post.tx_hash + "'>" +
        "      <input type='hidden' name='tx_hash' value='" + post.tx_hash + "'/>" +
        "      <label for='tip-" + post.tx_hash + "'>Tip</label>" +
        "      <input id='tip-" + post.tx_hash + "' class='form-control input-sm inline' type='text' name='tip' placeholder='0' />" +
        "      <input type='submit' class='btn btn-sm btn-primary' value='Like'/>" +
        "      <a class='btn btn-sm btn-default create-reply-link' data-tx-hash='" + post.tx_hash + "'>Reply</a>" +
        "    </form>" +
        "  </div>" +
        "  <div class='panel-body'>" +
        "    <p>" +
        ExampleComments.Template.Clean(post.message) +
        "    </p>" +
        (post.replies > 0 ? "" +
            "<p>" +
            "  <a class='view-replies-link' data-tx-hash='" + post.tx_hash + "'>" +
            post.replies + " replies" +
            "  </a>" +
            "</p>" : "") +
        "  </div>" +
        "</div>";
};

/**
 * @param {string} address
 * @returns string
 */
ExampleComments.Template.FundWallet = function (address) {
    return "" +
        "<div class='row'>" +
        "<div class='col-xs-12'>" +
        "Send funds to: " +
        "</div>" +
        "</div>" +
        "<br>" +
        "<div class='row'>" +
        "<div class='col-xs-3 col-title'>" +
        "Address" +
        "</div>" +
        "<div class='col-xs-9'>" +
        (ExampleComments.User.ApiBalance ?
            ExampleComments.User.ApiBalance.address +
            " (balance: " + ExampleComments.Helper.WithCommas(ExampleComments.User.ApiBalance.balance) + ")" +
            "</div>" +
            "</div>" +
            "<br>" +
            "<div class='row'>" +
            "<div class='col-xs-3 col-title'>" +
            "API Address" +
            "</div>" +
            "<div class='col-xs-9'>" +
            ExampleComments.User.ApiBalance.api_address +
            " (balance: " + ExampleComments.Helper.WithCommas(ExampleComments.User.ApiBalance.api_balance) + ")" : address) +
        "</div>" +
        "</div>" +
        "<br>" +
        "<div class='row'>" +
        "<div class='col-xs-12'>" +
        "<a class='btn btn-success' href='" + ExampleComments.User.GetMemoConnectUrl() + "'>Add Memo Funds</a>" +
        "</div>" +
        "</div>";
};

/**
 * @param {string=} currentAlias
 * @returns {string}
 */
ExampleComments.Template.SetAliasForm = function (currentAlias) {
    return "" +
        "<form id='set-alias-form'>" +
        "<div class='form-group row'>" +
        "<label for='alias' class='col-xs-3 col-form-label'>Alias</label>" +
        "<div class='col-xs-9'>" +
        "<input class='form-control' type='text' id='alias' name='alias' value='" + (currentAlias || "") + "' " +
        "placeholder='Alias'/>" +
        "</div>" +
        "</div>" +
        "<div class='form-group row'>" +
        "<div class='col-xs-9 col-xs-offset-3'>" +
        "<input class='btn btn-success' type='submit' value='Set'/> " +
        "<input class='btn btn-primary' type='button' onclick='ExampleComments.User.LoadInfoModal();' value='Cancel'/>" +
        "</div>" +
        "</div>" +
        "</form>";
};

/**
 * @param {string} txHash
 * @returns {string}
 */
ExampleComments.Template.ReplyForm = function (txHash) {
    return "" +
        "<form id='create-reply-form'>" +
        "<input type='hidden' name='tx_hash' value='" + txHash + "'/>" +
        "<div class='form-group row'>" +
        "<label for='create-reply-message' class='col-xs-3 col-form-label'>Reply</label>" +
        "<div class='col-xs-9'>" +
        "<textarea class='form-control' id='create-reply-message' name='reply' placeholder='Message'></textarea>" +
        "</div>" +
        "</div>" +
        "<div class='form-group row'>" +
        "<div class='col-xs-9 col-xs-offset-3'>" +
        "<input class='btn btn-success' type='submit' value='Post'/> " +
        "<input class='btn btn-primary' type='button' onclick='ExampleComments.Modal.CloseModal();' value='Cancel'/>" +
        "</div>" +
        "</div>" +
        "</form>";
};
