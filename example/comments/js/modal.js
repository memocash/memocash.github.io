ExampleComments.Modal = {};
(function () {
    var $modalWrapper,
        $siteCover,
        $siteWrapper,
        $innerWrapper,
        $document,
        $window,
        windowHeight,
        scrollTop,
        prevModals = [];
    $(function () {
        $modalWrapper = $("#site-modal-wrapper");
        $siteCover = $("#site-wrapper-cover");
        $siteWrapper = $("#site-wrapper");
        $innerWrapper = $("#inner-site-wrapper");
        $document = $(document);
        $window = $(window);
        $document.keyup(function (e) {
            if (e.keyCode === 27) {
                ExampleComments.Modal.ModalBack();
            }
        });
    });

    ExampleComments.Modal.ModalBack = function () {
        if (!prevModals.length) {
            ExampleComments.Modal.CloseModal();
            return;
        }
        var prevModal = prevModals.pop();
        $modalWrapper.find(">.container:not(.hidden)").remove();
        prevModal.Ele.removeClass("hidden");
        $document.scrollTop(prevModal.Scroll);
    };

    ExampleComments.Modal.CloseModal = function () {
        $siteWrapper.removeClass("active");
        $innerWrapper.css({top: 0});
        $document.scrollTop(scrollTop);
        $siteCover.removeClass("active");
        $modalWrapper.html("").hide();
        prevModals = [];
    };

    ExampleComments.Modal.FundWallet = function () {
        var address = ExampleComments.User.GetMainAddress();
        var text = ExampleComments.Template.FundWallet(address);
        ExampleComments.Modal.Main("Fund Wallet & API", text, 8, false);
    };

    /**
     * @param {string} title
     * @param {string} body
     * @param {number} width
     * @param {boolean} save
     */
    ExampleComments.Modal.Main = function (title, body, width, save) {
        if (!title) {
            title = "";
        }
        var $container = $modalWrapper.find(">.container:not(.hidden)");
        if ($container.hasClass("save")) {
            prevModals.push({
                Scroll: $document.scrollTop(),
                Ele: $container
            });
            $container.addClass("hidden");
        } else {
            $container.remove();
        }
        var headingHtml;
        if (prevModals.length > 0) {
            headingHtml = "<a class='btn btn-sm btn-default back' href='#'>" +
                "<span class='glyphicon glyphicon-arrow-left' aria-hidden='true'></span> " +
                "Back" +
                "</a>";
        } else {
            headingHtml = title;
        }
        var panelHeadingClass = "";
        if (headingHtml === "") {
            panelHeadingClass = "panel-heading-no-title";
        }
        var offset = (12 - width) / 2;
        var html =
            "<div class='container" + (save ? " save" : "") + "'>" +
            "<div id='main-modal' class='col-xs-12 col-sm-" + width + " col-sm-offset-" + offset + "'>" +
            "<div class='panel panel-default'>" +
            "<div class='panel-heading " + panelHeadingClass + "'>" +
            headingHtml +
            "<a data-toggle='collapse' class='close'>&times </a>" +
            "</div>" +
            "<div class='panel-body'>" +
            body +
            "</form>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>";
        $modalWrapper.append(html);
        if (!$modalWrapper.is(":visible")) {
            $modalWrapper.show();
            windowHeight = $window.height();
            scrollTop = $document.scrollTop();
            $siteWrapper.css({height: windowHeight});
            $innerWrapper.css({top: -scrollTop});
            $siteWrapper.addClass("active");
            $siteCover.addClass("active");
            $document.scrollTop(0);
        }
        $container = $modalWrapper.find(">.container:not(.hidden)");
        $container.find(".close").click(function (e) {
            e.preventDefault();
            ExampleComments.Modal.CloseModal();
        });
        if (prevModals.length > 0) {
            $container.find(".back").click(function (e) {
                e.preventDefault();
                ExampleComments.Modal.ModalBack();
            });
        }
        $modalWrapper.click(function (e) {
            if (e.target !== this && e.target !== $modalWrapper.find(".container:not(.hidden)")[0]) {
                return;
            }
            e.preventDefault();
            ExampleComments.Modal.CloseModal();
        });
    };
})();
