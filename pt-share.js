/* PoundTech: share + favourites for products.
   Add after your Supabase client is created:

     <script src="pt-share.js"></script>
     <script> PT.init(supabaseClient); </script>

   Guests save favourites on their own device. Logged-in customers save to their account,
   and anything saved as a guest is moved across when they log in.            */

(function () {

    var FAV_KEY = "poundtechFavourites";

    var PT = window.PT = {};

    var client = null;
    var user = null;
    var favourites = new Set();
    var changeListeners = [];
    var toastTimer = null;


    /* ---------- tiny helpers ---------- */

    PT.esc = function (value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    function esc(value) { return PT.esc(value); }

    function readLocal() {
        try {
            var list = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
            return Array.isArray(list) ? list.filter(function (x) { return typeof x === "string"; }) : [];
        } catch (e) {
            return [];
        }
    }

    function writeLocal(list) {
        try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) { /* storage blocked */ }
    }

    function money(value) {
        var n = Number(value);
        if (!isFinite(n)) { return ""; }
        return "R" + n.toLocaleString("en-ZA", {
            minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
            maximumFractionDigits: 2
        });
    }

    function productUrl(id) {
        return new URL("product.html?id=" + encodeURIComponent(id), window.location.href).href;
    }


    /* ---------- styles ---------- */

    var style = document.createElement("style");

    style.textContent =
        ".pt-actions{position:absolute;top:8px;right:8px;display:flex;gap:6px;z-index:2;}" +
        ".pt-btn{width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,.94);" +
        "box-shadow:0 2px 8px rgba(0,0,0,.18);display:inline-flex;align-items:center;justify-content:center;" +
        "cursor:pointer;padding:0;color:#111;transition:transform .15s;}" +
        ".pt-btn:hover{transform:scale(1.08);background:#fff;}" +
        ".pt-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;" +
        "stroke-linecap:round;stroke-linejoin:round;}" +
        ".pt-btn.on{color:#e00000;}" +
        ".pt-btn.on svg{fill:#e00000;}" +
        ".pt-pill{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:8px;" +
        "border:1px solid #ccc;background:#fff;color:#111;font:bold 14px Arial,Helvetica,sans-serif;cursor:pointer;}" +
        ".pt-pill:hover{border-color:#e00000;}" +
        ".pt-pill svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;" +
        "stroke-linecap:round;stroke-linejoin:round;}" +
        ".pt-pill.on{color:#e00000;border-color:#e00000;}" +
        ".pt-pill.on svg{fill:#e00000;}" +
        "#pt-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);" +
        "background:#111;color:#fff;padding:13px 20px;border-radius:8px;border-left:4px solid #e00000;" +
        "font:14px Arial,Helvetica,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25);opacity:0;" +
        "pointer-events:none;transition:opacity .25s,transform .25s;z-index:5000;max-width:90%;text-align:center;}" +
        "#pt-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}" +
        "#pt-sheet-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:4000;display:flex;" +
        "align-items:flex-end;justify-content:center;}" +
        "#pt-sheet{background:#fff;width:100%;max-width:440px;border-radius:16px 16px 0 0;padding:22px 20px 26px;" +
        "font-family:Arial,Helvetica,sans-serif;color:#111;}" +
        "#pt-sheet h3{font-size:18px;margin:0 0 4px;}" +
        "#pt-sheet .pt-sub{color:#666;font-size:14px;margin:0 0 16px;}" +
        "#pt-sheet .pt-opt{display:flex;align-items:center;gap:14px;width:100%;padding:14px 12px;margin:0;" +
        "border:none;border-bottom:1px solid #eee;background:none;font:15px Arial,Helvetica,sans-serif;" +
        "color:#111;text-align:left;text-decoration:none;cursor:pointer;box-sizing:border-box;}" +
        "#pt-sheet .pt-opt:hover{background:#f6f6f6;}" +
        "#pt-sheet .pt-opt svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;" +
        "stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;}" +
        "#pt-sheet .pt-opt small{display:block;color:#777;font-size:12px;margin-top:2px;}" +
        "#pt-sheet .pt-close{margin-top:14px;width:100%;padding:12px;border:none;border-radius:8px;" +
        "background:#111;color:#fff;font:bold 15px Arial,Helvetica,sans-serif;cursor:pointer;}" +
        "@media(max-width:700px){.pt-actions{top:5px;right:5px;gap:4px;}.pt-btn{width:30px;height:30px;}" +
        ".pt-btn svg{width:15px;height:15px;}}" +
        "@media(min-width:700px){#pt-sheet-bg{align-items:center;}#pt-sheet{border-radius:16px;}}";

    document.head.appendChild(style);


    /* ---------- icons ---------- */

    var HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    var SHARE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
    var CHAT_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5A8.4 8.4 0 1 1 21 11.5z"/></svg>';
    var WRENCH_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3l8.7-8.7z"/><path d="M14.7 6.3a4 4 0 0 1 5-1.6l-2.5 2.5.6 1.9 1.9.6 2.5-2.5a4 4 0 0 1-1.6 5"/></svg>';
    var LINK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/></svg>';


    /* ---------- buttons you place on pages ---------- */

    // Round heart for product cards (put inside a position:relative box).
    PT.heartButton = function (id) {
        return '<button type="button" class="pt-btn" data-pt-fav="' + esc(id) + '"' +
               ' aria-label="Save to favourites" aria-pressed="false">' + HEART_SVG + '</button>';
    };

    // Round share button. Needs the product so the message can include name and price.
    PT.shareButton = function (product) {
        return '<button type="button" class="pt-btn" data-pt-share="' + esc(product.id) + '"' +
               ' data-name="' + esc(product.name) + '" data-price="' + esc(product.price) + '"' +
               ' aria-label="Share this product">' + SHARE_SVG + '</button>';
    };

    // Both together, positioned top-right of the nearest relative parent.
    PT.cardActions = function (product) {
        return '<div class="pt-actions">' + PT.heartButton(product.id) + PT.shareButton(product) + '</div>';
    };

    // Wider labelled buttons for the product page.
    PT.heartPill = function (id) {
        return '<button type="button" class="pt-pill" data-pt-fav="' + esc(id) + '"' +
               ' aria-pressed="false">' + HEART_SVG + '<span data-pt-fav-label>Save</span></button>';
    };

    PT.sharePill = function (product) {
        return '<button type="button" class="pt-pill" data-pt-share="' + esc(product.id) + '"' +
               ' data-name="' + esc(product.name) + '" data-price="' + esc(product.price) + '">' +
               SHARE_SVG + 'Share</button>';
    };


    /* ---------- favourites ---------- */

    PT.isFavourite = function (id) { return favourites.has(String(id)); };
    PT.favouriteIds = function () { return Array.from(favourites); };
    PT.count = function () { return favourites.size; };
    PT.isLoggedIn = function () { return !!user; };
    PT.onChange = function (fn) { changeListeners.push(fn); };

    function notifyChange() {
        PT.refresh();
        changeListeners.forEach(function (fn) {
            try { fn(PT.favouriteIds()); } catch (e) { console.error(e); }
        });
    }

    PT.refresh = function () {

        document.querySelectorAll("[data-pt-fav]").forEach(function (el) {
            var on = favourites.has(el.getAttribute("data-pt-fav"));
            el.classList.toggle("on", on);
            el.setAttribute("aria-pressed", on ? "true" : "false");

            var label = el.querySelector("[data-pt-fav-label]");
            if (label) { label.textContent = on ? "Saved" : "Save"; }
        });

        document.querySelectorAll("[data-pt-saved-count]").forEach(function (el) {
            el.textContent = favourites.size;
        });
    };

    PT.toggle = async function (id) {

        id = String(id);

        var wasSaved = favourites.has(id);

        // Update the screen straight away; undo if saving fails.
        if (wasSaved) { favourites.delete(id); } else { favourites.add(id); }
        notifyChange();

        if (user && client) {

            var result;

            if (wasSaved) {
                result = await client.from("product_favourites")
                    .delete().eq("product_id", id).eq("user_id", user.id);
            } else {
                result = await client.from("product_favourites").insert({ product_id: id });
                if (result.error && result.error.code === "23505") { result = { error: null }; }
            }

            if (result.error) {
                console.error(result.error);
                if (wasSaved) { favourites.add(id); } else { favourites.delete(id); }
                notifyChange();
                PT.toast("We couldn't update your saved items. Please try again.");
                return;
            }

        } else {
            writeLocal(Array.from(favourites));
        }

        PT.toast(wasSaved
            ? "Removed from your saved items"
            : (user ? "Saved to your account" : "Saved on this device. Log in to keep it on your account."));
    };

    PT.init = function (supabaseClient) {

        client = supabaseClient;

        return (async function () {

            var session = null;

            try {
                var res = await client.auth.getSession();
                session = res && res.data && res.data.session;
            } catch (e) {
                console.error(e);
            }

            user = session ? session.user : null;

            if (!user) {
                favourites = new Set(readLocal());
                notifyChange();
                return;
            }

            var saved = await client.from("product_favourites").select("product_id");

            if (saved.error) {
                console.error(saved.error);
            }

            favourites = new Set((saved.data || []).map(function (row) { return String(row.product_id); }));

            // Move anything saved as a guest into the account.
            var local = readLocal().filter(function (id) { return !favourites.has(id); });

            if (local.length) {

                var results = await Promise.all(local.map(function (id) {
                    return client.from("product_favourites").insert({ product_id: id })
                        .then(function (r) { return { id: id, ok: !r.error || r.error.code === "23505" }; });
                }));

                results.forEach(function (r) { if (r.ok) { favourites.add(r.id); } });
            }

            writeLocal([]);
            notifyChange();

        })();
    };


    /* ---------- toast ---------- */

    PT.toast = function (message) {

        var el = document.getElementById("pt-toast");

        if (!el) {
            el = document.createElement("div");
            el.id = "pt-toast";
            el.setAttribute("role", "status");
            document.body.appendChild(el);
        }

        el.textContent = message;
        el.classList.add("show");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
    };


    /* ---------- share sheet ---------- */

    function copyText(text) {

        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }

        return new Promise(function (resolve, reject) {
            var box = document.createElement("textarea");
            box.value = text;
            box.style.position = "fixed";
            box.style.opacity = "0";
            document.body.appendChild(box);
            box.select();

            try {
                document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
            } catch (e) {
                reject(e);
            } finally {
                document.body.removeChild(box);
            }
        });
    }

    function closeSheet() {
        var bg = document.getElementById("pt-sheet-bg");
        if (bg) { bg.remove(); }
        document.removeEventListener("keydown", onSheetKey);
    }

    function onSheetKey(e) {
        if (e.key === "Escape") { closeSheet(); }
    }

    PT.share = function (product) {

        closeSheet();

        var url = productUrl(product.id);
        var name = product.name || "this product";
        var price = money(product.price);

        var headline = name + (price ? " for " + price : "") + " on PoundTech";

        var whatsappText = headline + "\n" + url;

        var mechanicText =
            "Hi, can you check if this part fits my car and let me know what it would cost to fit?\n" +
            headline + "\n" + url;

        var canNativeShare = typeof navigator.share === "function";

        var bg = document.createElement("div");
        bg.id = "pt-sheet-bg";

        bg.innerHTML =
            '<div id="pt-sheet" role="dialog" aria-modal="true" aria-label="Share this product">' +
                '<h3>Share this product</h3>' +
                '<p class="pt-sub">' + esc(name) + (price ? " &middot; " + esc(price) : "") + '</p>' +
                (canNativeShare
                    ? '<button type="button" class="pt-opt" data-act="native">' + SHARE_SVG + '<span>Share&hellip;</span></button>'
                    : "") +
                '<a class="pt-opt" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=' +
                    encodeURIComponent(whatsappText) + '">' + CHAT_SVG + '<span>WhatsApp</span></a>' +
                '<a class="pt-opt" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=' +
                    encodeURIComponent(mechanicText) + '">' + WRENCH_SVG +
                    '<span>Ask my mechanic<small>Sends a WhatsApp asking if it fits and what fitting costs</small></span></a>' +
                '<button type="button" class="pt-opt" data-act="copy">' + LINK_SVG + '<span>Copy link</span></button>' +
                '<button type="button" class="pt-close" data-act="close">Close</button>' +
            '</div>';

        document.body.appendChild(bg);
        document.addEventListener("keydown", onSheetKey);

        bg.addEventListener("click", function (e) {

            if (e.target === bg) { closeSheet(); return; }

            var button = e.target.closest("[data-act]");

            if (!button) {
                if (e.target.closest("a.pt-opt")) { setTimeout(closeSheet, 150); }
                return;
            }

            var act = button.getAttribute("data-act");

            if (act === "close") {
                closeSheet();
            } else if (act === "copy") {
                copyText(url).then(function () {
                    closeSheet();
                    PT.toast("Link copied");
                }).catch(function () {
                    PT.toast("Couldn't copy. Long-press the page address instead.");
                });
            } else if (act === "native") {
                navigator.share({ title: headline, text: headline, url: url })
                    .then(closeSheet)
                    .catch(function () { /* cancelled */ });
            }
        });
    };


    /* ---------- vehicle fit (same rules as the homepage) ---------- */

    var MAKE_ALIASES = {
        "volkswagen": ["volkswagen", "vw"],
        "mercedes benz": ["mercedes benz", "mercedes"],
        "bmw": ["bmw"],
        "toyota": ["toyota"]
    };

    function normalise(value) {
        return String(value || "").trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
    }

    // Returns "match", "universal", "unknown" or "mismatch".
    PT.fit = function (product, vehicle) {

        var raw = String(product.vehicle_compatibility || "").trim();

        if (!raw) { return "unknown"; }

        var entries = raw.split(/[,;\n]+/).map(normalise).filter(Boolean);

        if (entries.some(function (e) { return e === "universal"; })) { return "universal"; }

        var make = normalise(vehicle.make);
        var model = normalise(vehicle.model);
        var year = normalise(vehicle.year);
        var makes = MAKE_ALIASES[make] || [make];
        var vehicleName = normalise(vehicle.make + " " + vehicle.model);

        var matches = entries.some(function (entry) {

            var nameMatches = entry.indexOf(vehicleName) !== -1 ||
                (makes.some(function (alias) { return entry.indexOf(alias) !== -1; }) &&
                 entry.indexOf(model) !== -1);

            if (!nameMatches) { return false; }

            var years = entry.match(/\b(?:19|20)\d{2}\b/g);

            return !years || years.indexOf(year) !== -1;
        });

        return matches ? "match" : "mismatch";
    };


    /* ---------- wiring ---------- */

    // Capture phase so a tap on a heart or share button never opens the product card underneath.
    document.addEventListener("click", function (e) {

        var heart = e.target.closest && e.target.closest("[data-pt-fav]");

        if (heart) {
            e.preventDefault();
            e.stopPropagation();
            PT.toggle(heart.getAttribute("data-pt-fav"));
            return;
        }

        var share = e.target.closest && e.target.closest("[data-pt-share]");

        if (share) {
            e.preventDefault();
            e.stopPropagation();
            PT.share({
                id: share.getAttribute("data-pt-share"),
                name: share.getAttribute("data-name"),
                price: share.getAttribute("data-price")
            });
        }
    }, true);

    // Buttons added later (when a page redraws its product list) pick up their saved state.
    var refreshTimer = null;

    new MutationObserver(function () {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(PT.refresh, 30);
    }).observe(document.documentElement, { childList: true, subtree: true });

})();
