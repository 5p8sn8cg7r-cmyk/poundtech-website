/* PoundTech "Back to marketplace" button for inner pages.
   Add  <script src="nav.js"></script>  just before </body>.  */

(function () {

    if (document.getElementById("pt-back-button")) {
        return;
    }

    var style = document.createElement("style");

    style.textContent =
        "#pt-back-button{display:inline-block;margin:14px 5% 0;" +
        "background:#e00000;color:#fff;padding:9px 16px;border-radius:6px;" +
        "font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;" +
        "text-decoration:none;}" +
        "#pt-back-button:hover{background:#b80000;}";

    document.head.appendChild(style);

    var button = document.createElement("a");
    button.id = "pt-back-button";
    button.href = "index.html";
    button.innerHTML = "&larr; Back to marketplace";

    document.body.insertBefore(button, document.body.firstChild);

})();
