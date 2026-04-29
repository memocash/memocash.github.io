var DocApp = {
    Init: function () {
        // Mobile: scroll to top when expanding the navbar so the menu is visible.
        $(".navbar-header button").click(function () {
            $(window).scrollTop(0);
        });
        // Mobile: hide the expanded menu after picking a sidebar link.
        $(".sidebar a").click(function () {
            $(".navbar-collapse").collapse("hide");
        });
    }
};
