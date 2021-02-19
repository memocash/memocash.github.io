var DocApp = {
    Defaults: {
        PageName: "overview"
    },
    LoadPages: function () {
        $("[data-page]:not([data-page-done])").each(function () {
            var $this = $(this);
            var page = $this.attr("data-page");
            $this.attr("data-page-done", true);
            $.ajax({
                url: page,
                cache: false,
                success: function (contents) {
                    $this.html(contents);
                    DocApp.LoadPages();
                }
            });
        });
    },
    Init: function () {
        DocApp.Load(window.location.hash);
        DocApp.LoadPages();
    },
    /**
     * @param {jQuery} $button
     */
    BindNavCollapse: function ($button) {
        $button.click(function () {
            $(window).scrollTop(0);
        });
    },
    /**
     * @param {jQuery} $nav
     */
    BindNav: function ($nav) {
        $nav.find("a").click(function (e) {
            var href = $(this).attr("href");
            DocApp.Load(href);
            $('.navbar-collapse').collapse('hide');
        });
        $(window).on('hashchange', function () {
            DocApp.Load(window.location.hash);
            if (window.location.hash.split("-").length > 1) {
                var aTag = $(window.location.hash);
                $('html,body').scrollTop(aTag.offset().top);
            }
            if (window.location.hash === "#" + DocApp.GetPageName(window.location.hash)) {
                $(window).scrollTop(0);
            }
        });
    },
    /**
     * @param {string} hash
     * @returns {string}
     */
    GetPageName: function (hash) {
        var page = hash.replace(/^#/, "");
        if (!page || !page.length) {
            page = DocApp.Defaults.PageName;
        }
        var pageParts = page.split("-");
        var $page;
        for (var i = 0; pageParts.length > i; i++) {
            page = pageParts.slice(0, i + 1).join("-");
            $page = $("#page-" + page);
            if ($page.length) {
                return page;
            }
        }
        return "";
    },
    /**
     * @param {string} hash
     */
    Load: function (hash) {
        var pageName = DocApp.GetPageName(hash);
        var $page = $("#page-" + pageName);
        $(".main").addClass("hidden");
        $page.removeClass("hidden");
        $(".sidebar li").removeClass("active");
        if (pageName === DocApp.Defaults.PageName) {
            pageName = "";
        }
        $(".sidebar a[href$='#" + pageName + "']").parent("li").addClass("active");
    }
};
