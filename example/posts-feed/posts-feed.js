var PostsFeed = {};

(function () {
    var GraphHttpUrl = "https://graph.cash/graphql";
    var GraphWsUrl = "wss://graph.cash/graphql";
    var PageLimit = 20;

    var $posts;
    var $status;
    var $loadMore;
    var seenHashes = {};
    var oldestSeen;

    var PostFields = "" +
        "tx_hash " +
        "text " +
        "address " +
        "tx { seen } " +
        "lock { profile { name { name } } } " +
        "room { name }";

    PostsFeed.Init = function () {
        $posts = $("#posts");
        $status = $("#connection-status");
        $loadMore = $("#load-more");
        $loadMore.click(function () {
            PostsFeed.LoadOlder();
        });
        PostsFeed.LoadInitial();
        PostsFeed.Subscribe();
    };

    PostsFeed.LoadInitial = function () {
        var query = "" +
            "query Newest($limit: Uint32) { " +
            "  posts_newest(limit: $limit) { " + PostFields + " } " +
            "}";
        PostsFeed.GraphQL(query, {limit: PageLimit}, function (data) {
            var posts = (data && data.posts_newest) || [];
            for (var i = 0; i < posts.length; i++) {
                PostsFeed.AppendPost(posts[i]);
            }
            if (posts.length > 0) {
                oldestSeen = posts[posts.length - 1];
            }
        });
    };

    PostsFeed.LoadOlder = function () {
        if (!oldestSeen) {
            PostsFeed.LoadInitial();
            return;
        }
        var query = "" +
            "query Older($tx: Hash, $limit: Uint32) { " +
            "  posts_newest(tx: $tx, limit: $limit) { " + PostFields + " } " +
            "}";
        PostsFeed.GraphQL(query, {tx: oldestSeen.tx_hash, limit: PageLimit}, function (data) {
            var posts = (data && data.posts_newest) || [];
            // First entry is the cursor itself; skip it.
            var added = 0;
            for (var i = 0; i < posts.length; i++) {
                if (posts[i].tx_hash === oldestSeen.tx_hash) {
                    continue;
                }
                if (PostsFeed.AppendPost(posts[i])) {
                    added++;
                }
            }
            if (posts.length > 0) {
                oldestSeen = posts[posts.length - 1];
            }
            if (added === 0) {
                $loadMore.attr("disabled", true).text("No more posts");
            }
        });
    };

    function setStatus(text, state) {
        $status.text(text)
            .removeClass("connecting connected disconnected")
            .addClass(state);
    }

    PostsFeed.Subscribe = function () {
        setStatus("Connecting...", "connecting");
        var ws = new WebSocket(GraphWsUrl, "graphql-transport-ws");
        var subId = "posts-feed";
        ws.onopen = function () {
            ws.send(JSON.stringify({type: "connection_init"}));
        };
        ws.onmessage = function (event) {
            var msg;
            try {
                msg = JSON.parse(event.data);
            } catch (e) {
                return;
            }
            switch (msg.type) {
                case "connection_ack":
                    setStatus("Live", "connected");
                    var query = "" +
                        "subscription { " +
                        "  posts(hashes: []) { " + PostFields + " } " +
                        "}";
                    ws.send(JSON.stringify({
                        id: subId,
                        type: "subscribe",
                        payload: {query: query}
                    }));
                    break;
                case "next":
                    if (msg.payload && msg.payload.data && msg.payload.data.posts) {
                        PostsFeed.PrependPost(msg.payload.data.posts);
                    }
                    break;
                case "error":
                    console.error("subscription error", msg.payload);
                    break;
                case "ping":
                    ws.send(JSON.stringify({type: "pong"}));
                    break;
            }
        };
        ws.onclose = function () {
            setStatus("Disconnected", "disconnected");
            setTimeout(PostsFeed.Subscribe, 3000);
        };
        ws.onerror = function () {
            try {
                ws.close();
            } catch (e) {
            }
        };
    };

    /**
     * @param {string} query
     * @param {Object} variables
     * @param {function(Object)} done
     */
    PostsFeed.GraphQL = function (query, variables, done) {
        $.ajax({
            url: GraphHttpUrl,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({query: query, variables: variables}),
            success: function (response) {
                if (response.errors) {
                    console.error("graphql errors", response.errors);
                }
                done(response.data);
            },
            error: function (xhr, status, err) {
                console.error("graphql request failed", status, err);
            }
        });
    };

    /**
     * @param {Object} post
     * @returns {boolean} true if newly appended
     */
    PostsFeed.AppendPost = function (post) {
        if (!post || !post.tx_hash || seenHashes[post.tx_hash]) {
            return false;
        }
        seenHashes[post.tx_hash] = true;
        $posts.append(PostsFeed.Render(post, false));
        return true;
    };

    /**
     * @param {Object} post
     */
    PostsFeed.PrependPost = function (post) {
        if (!post || !post.tx_hash || seenHashes[post.tx_hash]) {
            return;
        }
        seenHashes[post.tx_hash] = true;
        var $el = $(PostsFeed.Render(post, true));
        $posts.prepend($el);
        setTimeout(function () {
            $el.removeClass("post-new");
        }, 2000);
    };

    /**
     * @param {Object} post
     * @param {boolean} isNew
     * @returns {string}
     */
    PostsFeed.Render = function (post, isNew) {
        var name = (post.lock && post.lock.profile && post.lock.profile.name && post.lock.profile.name.name) || "";
        var displayName = name.length ? name : post.address;
        var seen = (post.tx && post.tx.seen) ? new Date(post.tx.seen).toLocaleString() : "";
        var roomLink = "";
        if (post.room && post.room.name) {
            roomLink = " &middot; <a href='https://memo.cash/topic/" +
                encodeURIComponent(post.room.name) + "'>" + escapeHtml(post.room.name) + "</a>";
        }
        return "" +
            "<div class='post" + (isNew ? " post-new" : "") + "'>" +
            "  <div class='post-meta'>" +
            "    <a href='https://memo.cash/profile/" + encodeURIComponent(post.address) + "'>" +
            escapeHtml(displayName) + "</a>" +
            " &middot; " +
            "    <a href='https://memo.cash/post/" + encodeURIComponent(post.tx_hash) + "'>" +
            escapeHtml(seen || post.tx_hash.substring(0, 8)) + "</a>" +
            roomLink +
            "  </div>" +
            "  <div class='post-text'>" + escapeHtml(post.text || "") + "</div>" +
            "</div>";
    };

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
})();
