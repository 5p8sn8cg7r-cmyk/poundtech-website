// Shared application review for admin-suppliers.html and admin-mechanics.html.
// Needs the page to define: supabaseClient, esc().

(function () {

    var CSS = `
    .rv-tabs{display:flex;gap:8px;overflow-x:auto;margin:0 0 12px;padding-bottom:6px}
    .rv-tabs button{margin:0;background:#fff;color:#111;border:1px solid #d8d8d8;border-radius:999px;padding:9px 16px;font-size:14px;font-weight:600;white-space:nowrap}
    .rv-tabs button:hover{background:#f1f1f1}
    .rv-tabs button.on{background:#111;color:#fff;border-color:#111}
    .rv-tabs .c{display:inline-block;min-width:20px;margin-left:6px;padding:1px 7px;border-radius:999px;background:#eee;color:#111;font-size:12px}
    .rv-tabs .on .c{background:#fff}
    .rv-tabs .c.hot{background:#e00000;color:#fff}
    .rv-search{width:100%;padding:12px 14px;margin:0 0 14px;box-sizing:border-box;border:1px solid #d8d8d8;border-radius:10px;font-size:15px}
    .rv-card{background:#fff;border:1px solid #e3e3e3;border-radius:12px;margin-bottom:12px;padding:20px 22px}
    .rv-head{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-bottom:10px}
    .rv-head h2{margin:0;font-size:20px}
    .rv-pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#eee;color:#111}
    .rv-pill.green{background:#d4edda;color:#145c2a}
    .rv-pill.amber{background:#fff3cd;color:#7a5a00}
    .rv-pill.red{background:#fdecec;color:#8a1111}
    .rv-pill.dark{background:#111;color:#fff}
    .rv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:4px 20px;font-size:14px;margin-bottom:8px}
    .rv-grid p{margin:3px 0}
    .rv-sec{margin:16px 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#666;font-weight:700}
    .rv-docs{display:flex;flex-wrap:wrap;gap:8px}
    .rv-docs button{margin:0;background:#fff;color:#111;border:1px solid #bbb;padding:8px 12px;font-size:13px}
    .rv-docs button:hover{background:#f1f1f1}
    .rv-missing{color:#8a1111;font-size:13px;margin:4px 0}
    .rv-checks label{display:flex;gap:8px;align-items:flex-start;font-size:14px;margin:6px 0;cursor:pointer}
    .rv-checks input{width:auto;margin:3px 0 0}
    .rv-notes{width:100%;min-height:64px;box-sizing:border-box;padding:10px;border:1px solid #ccc;border-radius:8px;font-family:inherit;font-size:14px}
    .rv-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
    .rv-actions button{margin:0}
    .rv-actions .sec{background:#fff;color:#111;border:1px solid #bbb}
    .rv-actions .sec:hover{background:#f1f1f1}
    .rv-actions .dark{background:#555}
    .rv-empty{background:#fff;border:1px dashed #ccc;border-radius:12px;padding:30px;text-align:center;color:#666}
    `;

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var BUCKET = "applicant-documents";

    var DOC_LABELS = {
        id: "Owner ID", bank: "Bank letter", address: "Proof of address", registration: "Registration document",
        insurance: "Insurance", accreditation: "Accreditation", premises: "Workshop photo"
    };

    var CHECKS = {
        suppliers: [
            ["id", "Owner ID checked and matches the contact person"],
            ["reg", "Business registration checked on CIPC (or sole proprietor confirmed)"],
            ["bank", "Bank letter is recent and the account is in the business name"],
            ["address", "Business address confirmed"],
            ["contact", "Phone and email reach the applicant"]
        ],
        mechanics: [
            ["id", "Owner ID checked and matches the contact person"],
            ["reg", "Business registration checked on CIPC (or sole proprietor confirmed)"],
            ["address", "Workshop address confirmed (documents, photos, map)"],
            ["insurance", "Public liability insurance seen (or accepted without it)"],
            ["accreditation", "Accreditation confirmed with the issuing body (or none claimed)"],
            ["contact", "Phone and email reach the applicant"]
        ]
    };

    var state = {};   // per kind: { tab, query, rows, container, reload }

    function checklistOf(row) { return (row.checklist && typeof row.checklist === "object") ? row.checklist : {}; }
    function docsOf(row) { return Array.isArray(row.documents) ? row.documents : []; }

    function group(row) {
        if (row.status === "Approved") { return "approved"; }
        if (row.status === "Rejected") { return "rejected"; }
        return row.info_requested_at ? "info" : "pending";
    }

    var TABS = [
        { id: "pending",  label: "To review" },
        { id: "info",     label: "Info requested" },
        { id: "approved", label: "Approved" },
        { id: "rejected", label: "Rejected" },
        { id: "all",      label: "All" }
    ];

    function count(kind, tab) {
        return state[kind].rows.filter(function (r) { return tab === "all" || group(r) === tab; }).length;
    }

    window.renderApplications = function (kind, rows, container, reload) {

        var prev = state[kind];

        state[kind] = {
            tab: prev ? prev.tab : "pending",
            query: prev ? prev.query : "",
            rows: rows || [],
            container: container,
            reload: reload
        };

        container.innerHTML =
            '<div class="rv-tabs" id="rv-tabs-' + kind + '"></div>' +
            '<input class="rv-search" id="rv-search-' + kind + '" type="search" ' +
            'placeholder="Search by business, contact, email or phone" value="' + esc(state[kind].query) + '">' +
            '<div id="rv-list-' + kind + '"></div>';

        document.getElementById("rv-search-" + kind).addEventListener("input", function () {
            state[kind].query = this.value;
            paintList(kind);
        });

        paintTabs(kind);
        paintList(kind);
    };

    function paintTabs(kind) {
        var el = document.getElementById("rv-tabs-" + kind);
        el.innerHTML = TABS.map(function (t) {
            var n = count(kind, t.id);
            var hot = t.id === "pending" && n > 0;
            return '<button type="button" class="' + (state[kind].tab === t.id ? "on" : "") +
                   '" data-tab="' + t.id + '">' + t.label + '<span class="c ' + (hot ? "hot" : "") + '">' + n + '</span></button>';
        }).join("");

        Array.prototype.forEach.call(el.querySelectorAll("button"), function (b) {
            b.addEventListener("click", function () {
                state[kind].tab = b.getAttribute("data-tab");
                paintTabs(kind);
                paintList(kind);
            });
        });
    }

    function paintList(kind) {

        var s = state[kind];
        var q = s.query.trim().toLowerCase();

        var rows = s.rows.filter(function (r) {
            if (s.tab !== "all" && group(r) !== s.tab) { return false; }
            if (!q) { return true; }
            return [r.business_name, r.contact_name, r.email, r.phone].join(" ").toLowerCase().indexOf(q) !== -1;
        });

        // Oldest waiting first, so no application is forgotten.
        rows.sort(function (a, b) {
            var d = new Date(a.created_at) - new Date(b.created_at);
            return (s.tab === "pending" || s.tab === "info") ? d : -d;
        });

        var list = document.getElementById("rv-list-" + kind);

        if (rows.length === 0) {
            list.innerHTML = '<div class="rv-empty">' + (q ? "No applications match your search." : "Nothing here right now.") + '</div>';
            return;
        }

        list.innerHTML = rows.map(function (r) { return cardHTML(kind, r); }).join("");

        Array.prototype.forEach.call(list.querySelectorAll("[data-act]"), function (btn) {
            btn.addEventListener("click", function () {
                act(kind, btn.getAttribute("data-id"), btn.getAttribute("data-act"), btn.getAttribute("data-path"));
            });
        });
    }

    function statusPill(r) {
        var g = group(r);
        if (g === "approved") { return '<span class="rv-pill green">Approved</span>'; }
        if (g === "rejected") { return '<span class="rv-pill red">Rejected</span>'; }
        if (g === "info") { return '<span class="rv-pill amber">Info requested</span>'; }
        return '<span class="rv-pill amber">To review</span>';
    }

    function cardHTML(kind, r) {

        var docs = docsOf(r);
        var checks = checklistOf(r);
        var id = esc(r.id);

        var docButtons = docs.map(function (d) {
            return '<button type="button" data-act="doc" data-id="' + id + '" data-path="' + esc(d.path) + '">' +
                   esc(DOC_LABELS[d.type] || d.type) + '</button>';
        }).join("");

        var required = kind === "suppliers" ? ["id", "bank", "address"] : ["id", "address"];
        var have = docs.map(function (d) { return d.type; });
        var missing = required.filter(function (t) { return have.indexOf(t) === -1; });

        var checkHTML = CHECKS[kind].map(function (c) {
            return '<label><input type="checkbox" data-check="' + c[0] + '" ' + (checks[c[0]] ? "checked" : "") + '> ' + esc(c[1]) + '</label>';
        }).join("");

        var details = kind === "suppliers"
            ? '<p><strong>Business type:</strong> ' + esc(r.business_type) + '</p>'
            : '<p><strong>Service area:</strong> ' + esc(r.service_area || "Not provided") + '</p>' +
              '<p><strong>Services:</strong> ' + esc(r.services || "Not provided") + '</p>';

        var about = kind === "mechanics" && r.description
            ? '<p style="font-size:14px;margin:6px 0 0;"><strong>About:</strong> ' + esc(r.description) + '</p>' : "";

        var actions = "";

        if (r.status === "Approved") {
            actions =
                '<button type="button" class="sec" data-act="save" data-id="' + id + '">Save checks and notes</button>' +
                (r.verified
                    ? '<button type="button" class="sec" data-act="unverify" data-id="' + id + '">Remove Verified badge</button>'
                    : '<button type="button" data-act="verify" data-id="' + id + '">Mark Verified</button>');
        } else if (r.status === "Rejected") {
            actions =
                '<button type="button" class="sec" data-act="save" data-id="' + id + '">Save notes</button>' +
                '<button type="button" class="sec" data-act="reopen" data-id="' + id + '">Move back to review</button>';
        } else {
            actions =
                '<button type="button" data-act="approve" data-id="' + id + '">Approve and mark Verified</button>' +
                '<button type="button" class="sec" data-act="save" data-id="' + id + '">Save checks and notes</button>' +
                '<button type="button" class="sec" data-act="info" data-id="' + id + '">Request more info</button>' +
                '<button type="button" class="dark" data-act="reject" data-id="' + id + '">Reject</button>';
        }

        return '<div class="rv-card" id="rv-' + id + '">' +
            '<div class="rv-head"><h2>' + esc(r.business_name) + '</h2>' + statusPill(r) +
            (r.verified ? '<span class="rv-pill dark">Verified</span>' : "") +
            '<span style="flex:1"></span><span style="color:#777;font-size:13px;">Applied ' +
            esc(new Date(r.created_at).toLocaleDateString()) + '</span></div>' +

            '<div class="rv-grid">' +
            '<p><strong>Contact:</strong> ' + esc(r.contact_name) + '</p>' +
            '<p><strong>Phone:</strong> ' + esc(r.phone) + '</p>' +
            '<p><strong>Email:</strong> ' + esc(r.email) + '</p>' +
            '<p><strong>Address:</strong> ' + esc(r.address || "Not provided") + '</p>' +
            '<p><strong>Registration no.:</strong> ' + esc(r.registration_number || "None given") + '</p>' +
            details + '</div>' + about +

            '<div class="rv-sec">Documents</div>' +
            (docButtons ? '<div class="rv-docs">' + docButtons + '</div>' : '<p style="font-size:14px;color:#777;margin:0;">No documents uploaded (applied before document checks started).</p>') +
            (docs.length && missing.length ? '<p class="rv-missing">Missing: ' + missing.map(function (t) { return esc(DOC_LABELS[t] || t); }).join(", ") + '</p>' : "") +

            '<div class="rv-sec">Checks</div><div class="rv-checks">' + checkHTML + '</div>' +

            '<div class="rv-sec">Internal notes (never shown to the applicant)</div>' +
            '<textarea class="rv-notes" data-notes>' + esc(r.review_notes || "") + '</textarea>' +

            '<div class="rv-actions">' + actions + '</div></div>';
    }

    function readCard(id) {
        var card = document.getElementById("rv-" + id);
        var checks = {};
        Array.prototype.forEach.call(card.querySelectorAll("[data-check]"), function (c) {
            checks[c.getAttribute("data-check")] = c.checked;
        });
        return { checks: checks, notes: card.querySelector("[data-notes]").value.trim() };
    }

    function table(kind) { return kind === "suppliers" ? "suppliers" : "mechanics"; }

    async function act(kind, id, action, path) {

        var s = state[kind];

        if (action === "doc") {
            var res = await supabaseClient.storage.from(BUCKET).createSignedUrl(path, 120);
            if (res.error || !res.data) {
                alert("Could not open that document: " + (res.error ? res.error.message : "not found"));
                return;
            }
            window.open(res.data.signedUrl, "_blank", "noopener");
            return;
        }

        var form = readCard(id);
        var update = { checklist: form.checks, review_notes: form.notes || null };
        var message = null;

        if (action === "approve") {
            var all = CHECKS[kind].every(function (c) { return form.checks[c[0]]; });
            if (!all && !confirm("Not every check is ticked. Approve anyway?")) { return; }
            if (all && !confirm("Approve this " + (kind === "suppliers" ? "supplier" : "business") + " and mark them Verified?")) { return; }
            update.status = "Approved"; update.verified = all; update.verified_at = all ? new Date().toISOString() : null;
            update.info_requested_at = null;
        } else if (action === "reject") {
            if (!confirm("Reject this application?")) { return; }
            update.status = "Rejected"; update.verified = false; update.verified_at = null;
        } else if (action === "info") {
            update.info_requested_at = new Date().toISOString();
            message = "Marked as info requested. Contact the applicant by email or phone and record what you asked in the notes.";
        } else if (action === "reopen") {
            update.status = "Pending";
        } else if (action === "verify") {
            update.verified = true; update.verified_at = new Date().toISOString();
        } else if (action === "unverify") {
            if (!confirm("Remove the Verified badge?")) { return; }
            update.verified = false; update.verified_at = null;
        } else if (action === "save") {
            message = "Saved.";
        }

        var r = await supabaseClient.from(table(kind)).update(update).eq("id", id);

        if (r.error) {
            alert("Could not save: " + r.error.message + "\n\nRun 15_migration14_onboarding.sql in Supabase if you haven't.");
            return;
        }

        if (message) { alert(message); }

        s.reload();
    }

})();
