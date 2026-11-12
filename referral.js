/* PoundTech referral-link capture.
   First-touch attribution is stored server-side for 30 days.
   Include this file on marketplace, service-booking and pre-owned pages. */
(function () {
    "use strict";

    var params = new URLSearchParams(window.location.search);
    var incomingCode = (params.get("ref") || "").trim().toUpperCase();
    var tokenKey = "ptReferralVisitorToken";
    var visitorToken = "";

    try {
        visitorToken = localStorage.getItem(tokenKey) || "";
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorToken)) {
            visitorToken = (window.crypto && window.crypto.randomUUID)
                ? window.crypto.randomUUID()
                : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0;
                    return (c === "x" ? r : (r & 3 | 8)).toString(16);
                });
            localStorage.setItem(tokenKey, visitorToken);
        }
    } catch (storageError) {
        return;
    }

    if (!window.supabase || !window.supabase.createClient) return;

    var client = window.supabase.createClient(
        "https://uezacbssvvvtlosnaroh.supabase.co",
        "sb_publishable_Abl4zMUx_hMAsk6gjk6oGw_ak7ybUJQ"
    );

    var capturePromise = Promise.resolve();

    window.PTReferral = {
        getVisitorToken: function () { return visitorToken; },
        attach: function (transactionType, transactionId, customerEmail) {
            if (!visitorToken || !transactionId || !customerEmail) {
                return Promise.resolve({ data: { success: true, result: "no_referral_token" }, error: null });
            }
            return capturePromise.then(function () {
                return client.rpc("attach_referral_attribution", {
                    p_visitor_token: visitorToken,
                    p_transaction_type: transactionType,
                    p_transaction_id: String(transactionId),
                    p_customer_email: String(customerEmail).trim().toLowerCase()
                });
            });
        }
    };

    if (!incomingCode || !/^[A-Z0-9-]{4,24}$/.test(incomingCode)) return;

    capturePromise = client.rpc("capture_referral_attribution", {
        p_referral_code: incomingCode,
        p_visitor_token: visitorToken
    }).then(function (result) {
        if (result.error) {
            console.warn("PoundTech referral capture was not completed:", result.error.message);
            return;
        }
        if (result.data && result.data.success) {
            params.delete("ref");
            var query = params.toString();
            var cleanUrl = window.location.pathname +
                (query ? "?" + query : "") + window.location.hash;
            window.history.replaceState({}, "", cleanUrl);
        }
    }).catch(function (error) {
        console.warn("PoundTech referral capture was not completed:", error);
    });
})();
