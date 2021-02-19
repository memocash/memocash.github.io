var ExampleComments = {
    Helper: {},
    Const: {
        ModAddresses: ["1QCBiyfwdjXDsHghBEr5U2KxUpM2BmmJVt"],
        WebHost: "https://beta.memo.cash",
        ApiHost: "https://beta-api.memo.cash"
    }
};

/**
 * @returns {string}
 */
ExampleComments.Helper.GetBaseMemoUrl = function () {
    if (localStorage.WebHost) {
        return localStorage.WebHost;
    }
    return ExampleComments.Const.WebHost;
};

/**
 * @returns {string}
 */
ExampleComments.Helper.GetBaseApiUrl = function () {
    if (localStorage.ApiHost) {
        return localStorage.ApiHost;
    }
    return ExampleComments.Const.ApiHost;
};

/**
 * @param {string} address
 * @returns string
 */
ExampleComments.Helper.ShortAddress = function (address) {
    if (address.length < 10) {
        return address;
    }
    return address.substr(0, 5) + "..." + address.substr(address.length - 5);
};

/**
 * @param {number} x
 * @returns {string}
 */
ExampleComments.Helper.WithCommas = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
