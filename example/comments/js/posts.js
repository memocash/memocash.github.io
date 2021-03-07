ExampleComments.Posts = {};

(function () {
    var TestTopic = "comments";
    var $comments;
    var modAddresses;

    /**
     * @param {jQuery} $newComments
     * @param {[string]=} newModAddresses
     */
    ExampleComments.Posts.SetComments = function ($newComments, newModAddresses) {
        $comments = $newComments;
        modAddresses = newModAddresses;
    };

    ExampleComments.Posts.Load = function () {
        jmemo.Client.Topic.Posts.Get(TestTopic, 0, modAddresses, function (posts) {
            ExampleComments.Posts.LoadTemplate($comments, posts);
        });
    };

    /**
     * @param {jQuery} $output
     * @param {[MemoApiPost]} posts
     */
    ExampleComments.Posts.LoadTemplate = function ($output, posts) {
        if (!posts) {
            $output.html("No comments yet");
            return;
        }
        posts = posts.reverse();
        var output = "";
        var i;
        for (i = 0; i < posts.length; i++) {
            output += ExampleComments.Template.Post(posts[i]);
        }
        $output.html(output);
        $(".like-form").submit(function (e) {
            e.preventDefault();
            if (!localStorage.ApiToken) {
                ExampleComments.User.LoadInfoModal("Please connect Memo account.", "danger");
                return;
            }
            var address = ExampleComments.User.GetMainAddress();
            var $form = $(this);
            var txHash = $form.find("[name=tx_hash]").val();
            var tip = $form.find("[name=tip]").val();
            jmemo.Client.Create.Like(localStorage.ApiToken, localStorage.ApiSecret, address, tip, txHash, ExampleComments.Tx.GetSignHandler(function () {
                ExampleComments.Posts.Load();
                ExampleComments.User.LoadBalance(false);
            }), function (err) {
                if (err === 402) {
                    ExampleComments.Modal.FundWallet();
                }
            });
        });
        $(".create-reply-link").click(function () {
            var txHash = $(this).attr("data-tx-hash");
            var html = ExampleComments.Template.ReplyForm(txHash);
            ExampleComments.Modal.Main("Create Reply", html, 8, false);
            var $createReplyForm = $("#create-reply-form");
            var mainAddress = ExampleComments.User.GetMainAddress();
            $createReplyForm.submit(function () {
                var reply = $createReplyForm.find("[name=reply]").val();
                jmemo.Client.Create.Reply(localStorage.ApiToken, localStorage.ApiSecret, mainAddress, txHash, reply, ExampleComments.Tx.GetSignHandler(function () {
                    ExampleComments.Posts.Load();
                    ExampleComments.User.LoadBalance(false);
                    ExampleComments.Modal.CloseModal();
                }), function (error) {
                    alert("error setting reply: " + error);
                });
                return false;
            });
        });
        $(".view-replies-link").click(function (e) {
            e.preventDefault();
            var $this = $(this);
            var $parent = $(this).parent("p");
            var $replyContainer = $("<div class='reply-container'></div>");
            $parent.after($replyContainer);
            var txHash = $this.attr("data-tx-hash");
            jmemo.Client.Post.Replies(txHash, 0, modAddresses, function (jsonString) {
                ExampleComments.Posts.LoadTemplate($replyContainer, jsonString);
                $parent.remove();
            });
        })
    };

    /**
     * @param {jQuery} $form
     */
    ExampleComments.Posts.Form = function ($form) {
        var $comment = $form.find("[name=comment]");
        $form.submit(function (e) {
            e.preventDefault();
            var address = ExampleComments.User.GetMainAddress();
            var comment = $comment.val();
            if (!localStorage.ApiToken) {
                ExampleComments.User.LoadInfoModal("Please connect Memo account.", "danger");
                return;
            }
            jmemo.Client.Topic.CreatePost(localStorage.ApiToken, localStorage.ApiSecret, address, TestTopic, comment, ExampleComments.Tx.GetSignHandler(function () {
                ExampleComments.Posts.Load();
            }), function (err) {
                if (err === 402) {
                    ExampleComments.Modal.FundWallet();
                }
            });
        })
    };
})();
