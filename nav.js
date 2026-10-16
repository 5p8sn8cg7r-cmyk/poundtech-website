/* PoundTech slim top navigation bar for inner pages.
   Add  <script src="nav.js"></script>  just before </body>.  */

(function () {

    if (document.getElementById("pt-topbar")) {
        return;
    }

    var css = "" +
        "#pt-topbar{position:sticky;top:0;z-index:1500;background:#0d0f12;" +
        "border-bottom:1px solid #1f2227;display:flex;align-items:center;gap:18px;" +
        "padding:10px 5%;font-family:Arial,Helvetica,sans-serif;}" +
        "#pt-topbar a{text-decoration:none;}" +
        "#pt-topbar .pt-logo{font-size:18px;font-weight:900;letter-spacing:1px;color:#fff;}" +
        "#pt-topbar .pt-logo span{color:#e00000;}" +
        "#pt-topbar .pt-links{margin-left:auto;display:flex;gap:18px;}" +
        "#pt-topbar .pt-links a{color:#c7c7c7;font-size:13px;}" +
        "#pt-topbar .pt-links a:hover{color:#e00000;}" +
        "#pt-topbar .pt-back{background:#e00000;color:#fff;padding:8px 14px;" +
        "border-radius:6px;font-size:13px;font-weight:bold;white-space:nowrap;}" +
        "#pt-topbar .pt-back:hover{background:#b80000;}" +
        "@media (max-width:640px){" +
        "#pt-topbar .pt-links{display:none;}" +
        "#pt-topbar .pt-back{margin-left:auto;}" +
        "}";

    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement("div");
    bar.id = "pt-topbar";

    bar.innerHTML =
        '<a class="pt-logo" href="index.html">POUND<span>TECH</span></a>' +
        '<nav class="pt-links">' +
            '<a href="mechanics.html">Mechanics</a>' +
            '<a href="track-order.html">Track Order</a>' +
            '<a href="customer-login.html" id="pt-garage">My Garage</a>' +
        '</nav>' +
        '<a class="pt-back" href="index.html">&larr; Back to marketplace</a>';

    document.body.insertBefore(bar, document.body.firstChild);

    // If the page has a Supabase client and the customer is logged in,
    // send "My Garage" straight to their garage.
    try {
        if (typeof supabaseClient !== "undefined") {
            supabaseClient.auth.getSession().then(function (result) {
                if (result && result.data && result.data.session) {
                    document.getElementById("pt-garage").href = "garage.html";
                }
            });
        }
    } catch (e) {
        /* navigation still works without it */
    }

})();
