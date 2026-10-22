/* PoundTech shared "Back to marketplace" button for inner pages.
   Include <script src="nav.js"></script> just before </body>. */

(function () {
    var existing = document.getElementById("pt-back-button");

    if (!existing) {
        var links = document.querySelectorAll("a");
        for (var i = 0; i < links.length; i++) {
            var label = (links[i].textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
            if (label === "back to marketplace" || label === "← back to marketplace" ||
                label === "back to the marketplace" || label === "← back to the marketplace") {
                existing = links[i];
                break;
            }
        }
    }

    var style = document.createElement("style");
    style.textContent =
        "#pt-back-button{display:inline-block;margin:16px 5% 0;" +
        "background:#e00000;color:#fff;padding:9px 16px;border-radius:6px;" +
        "font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;" +
        "text-decoration:none;box-sizing:border-box;}" +
        "#pt-back-button:hover{background:#b80000;color:#fff;}" +
        "#pt-back-button:focus-visible{outline:2px solid #111;outline-offset:3px;}";
    document.head.appendChild(style);

    if (existing) {
        existing.id = "pt-back-button";
        existing.href = "index.html";
        existing.innerHTML = "&larr; Back to marketplace";
        return;
    }

    var button = document.createElement("a");
    button.id = "pt-back-button";
    button.href = "index.html";
    button.innerHTML = "&larr; Back to marketplace";

    // Place it directly below the page header where possible.
    var header = document.querySelector("header, .site-header");
    if (header && header.parentNode) {
        header.parentNode.insertBefore(button, header.nextSibling);
    } else {
        document.body.insertBefore(button, document.body.firstChild);
    }
})();
