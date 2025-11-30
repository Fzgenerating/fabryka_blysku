// Google Places - produkcyjny Place ID podany przez klienta (Klasyk Portowy Barber Shop)
const DEFAULT_PLACE_ID = "ChIJ8e6j9v3NHkcRf16BlEm9VpQ";
const GOOGLE_API_KEY = "AIzaSyBBEGLuDhhYTF23KVnBC4XZa_KmTWQaZFs";
const DEFAULT_GOOGLE_AVATAR = "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/user_circle.png";
const REVIEWS_CACHE_KEY = "kp_reviews_cache_v2";
const REVIEWS_CACHE_TTL = 1000 * 60 * 60 * 12; // 12h

// Loader skryptu Google Maps JS (Places) współdzielony między wywołaniami
let googleMapsScriptPromise = null;
const REVIEWS_FALLBACK = [];

// script.js - logika interfejsu Klasyk Portowy Barber Shop

document.addEventListener("DOMContentLoaded", function () {
    setupSmoothScroll();
    setupMobileMenu();
    setupIntersectionObserver();
    setupContactFormHandling();
    setCurrentYear();
    initCookieBanner();
    loadPricing();
    loadGoogleReviews();
    initTeamFallbacks();
});

/**
 * Płynne przewijanie do sekcji
 */
function setupSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"], [data-scroll-target]');

    scrollLinks.forEach(function (el) {
        el.addEventListener("click", function (event) {
            const href = el.getAttribute("href");
            const targetId = href && href.startsWith("#")
                ? href
                : el.getAttribute("data-scroll-target");

            if (!targetId || targetId === "#") return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                event.preventDefault();
                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                // Jeśli klikamy z mobilnego menu, schowaj je
                document.body.classList.remove("nav-open");
                const toggle = document.querySelector(".nav-toggle");
                if (toggle) toggle.setAttribute("aria-expanded", "false");
            }
        });
    });
}

/**
 * Obsługa mobilnego menu (hamburger)
 */
function setupMobileMenu() {
    const toggle = document.querySelector(".nav-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
        const isOpen = document.body.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Zamknięcie menu po zmianie rozmiaru ekranu na desktop
    window.addEventListener("resize", function () {
        if (window.innerWidth >= 768 && document.body.classList.contains("nav-open")) {
            document.body.classList.remove("nav-open");
            toggle.setAttribute("aria-expanded", "false");
        }
    });
}

/**
 * IntersectionObserver do animacji wejścia sekcji
 */
function setupIntersectionObserver() {
    const observed = document.querySelectorAll(".js-observe");
    if (!("IntersectionObserver" in window) || observed.length === 0) {
        observed.forEach(function (el) {
            el.classList.add("in-view");
        });
        return;
    }

    const observer = new IntersectionObserver(
        function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in-view");
                    obs.unobserve(entry.target);
                }
            });
        },
        {
            root: null,
            rootMargin: "0px 0px -15% 0px",
            threshold: 0.15
        }
    );

    observed.forEach(function (el) {
        observer.observe(el);
    });
}

/**
 * Obsługa formularza: walidacja + wysyłka
 * - lokalnie (file://) otwiera mailto z gotową treścią
 * - na serwerze wysyła do contact.php i zwraca JSON
 */
function setupContactFormHandling() {
    const form = document.getElementById("contact-form");
    const messageEl = document.getElementById("form-message");

    if (!form || !messageEl) return;

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        messageEl.textContent = "";
        messageEl.classList.remove("error", "success");

        const formData = new FormData(form);
        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const phone = String(formData.get("phone") || "").trim();
        const subject = String(formData.get("subject") || "").trim();
        const message = String(formData.get("message") || "").trim();

        const errors = [];

        if (!name) errors.push("Podaj swoje imię i nazwisko.");
        if (!email) {
            errors.push("Podaj adres e-mail.");
        } else if (!isValidEmail(email)) {
            errors.push("Podaj poprawny adres e-mail.");
        }
        if (!subject) errors.push("Podaj temat wiadomości.");
        if (!message) errors.push("Napisz treść wiadomości.");

        if (errors.length > 0) {
            messageEl.textContent = errors.join(" ");
            messageEl.classList.add("error");
            return;
        }

        // Tryb lokalny - otwieramy klienta poczty z gotowym mailem
        if (window.location.protocol === "file:") {
            const mailTo = "kontakt.fabrykablysku@gmail.com";
            const mailSubject = "Zapytanie z formularza Fabryka Błysku";
            const mailBody =
                "Imię i nazwisko: " + name + "\n" +
                "E-mail: " + email + "\n" +
                (phone ? "Telefon: " + phone + "\n" : "") +
                "Temat: " + subject + "\n\n" +
                "Wiadomość:\n" + message;

            const mailtoUrl =
                "mailto:" + encodeURIComponent(mailTo) +
                "?subject=" + encodeURIComponent(mailSubject) +
                "&body=" + encodeURIComponent(mailBody);

            window.location.href = mailtoUrl;

            messageEl.textContent = "Otworzyliśmy domyślny program pocztowy z gotowym mailem. Sprawdź i kliknij Wyślij.";
            messageEl.classList.add("success");
            return;
        }

        // Tryb serwerowy - wysyłka do contact.php
        const body = new URLSearchParams();
        body.append("name", name);
        body.append("email", email);
        body.append("phone", phone);
        body.append("subject", subject);
        body.append("message", message);

        messageEl.textContent = "Wysyłanie wiadomości...";
        messageEl.classList.remove("error", "success");

        fetch("contact.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
            },
            body: body.toString()
        })
            .then(function (response) {
                return response.json().catch(function () {
                    return { success: false, message: "Wystąpił błąd po stronie serwera." };
                });
            })
            .then(function (data) {
                if (data && data.success) {
                    messageEl.textContent = data.message || "Dziękujemy za wiadomość. Skontaktujemy się z Tobą tak szybko jak to możliwe.";
                    messageEl.classList.add("success");
                    form.reset();
                } else {
                    messageEl.textContent = data && data.message
                        ? data.message
                        : "Nie udało się wysłać wiadomości. Spróbuj ponownie później.";
                    messageEl.classList.add("error");
                }
            })
            .catch(function () {
                messageEl.textContent = "Nie udało się nawiązać połączenia z serwerem. Spróbuj ponownie później.";
                messageEl.classList.add("error");
            });
    });
}

/**
 * Prosta walidacja e-maila
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
}

/**
 * Ustawienie aktualnego roku w stopce
 */
function setCurrentYear() {
    const yearEl = document.getElementById("year");
    if (!yearEl) return;
    const now = new Date();
    yearEl.textContent = String(now.getFullYear());
}

/**
 * Baner cookies zgodny z RODO (informacyjnie, z lokalnym zapisem zgody)
 */
function initCookieBanner() {
    const banner = document.getElementById("cookie-banner");
    const acceptBtn = document.getElementById("cookie-accept");
    if (!banner || !acceptBtn) return;

    const storageKey = "fabrykaBlyskuCookieConsent";

    if (localStorage.getItem(storageKey) === "accepted") {
        banner.style.display = "none";
        initMarketingTracking();
        return;
    }

    banner.style.display = "flex";
    acceptBtn.addEventListener("click", function () {
        localStorage.setItem(storageKey, "accepted");
        banner.style.display = "none";
        initMarketingTracking();
    });
}

function initMarketingTracking() {
    const body = document.body;
    if (!body) return;

    const metaPixelId = body.dataset.metaPixelId;
    const tiktokPixelId = body.dataset.tiktokPixelId;

    if (metaPixelId) {
        loadMetaPixel(metaPixelId);
    }

    if (tiktokPixelId) {
        loadTikTokPixel(tiktokPixelId);
    }
}

function loadMetaPixel(pixelId) {
    if (window.fbq) return;
    !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0";
        n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
}

function loadTikTokPixel(pixelId) {
    if (window.ttq) return;
    (function (w, d, t) {
        w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
        ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "upload", "setAndDefer", "register" ,"registerOnce"];
        ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (t) { var e = ttq._i[t] || []; for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
        ttq.load = function (e, n) { var i = "https://analytics.tiktok.com/i18n/pixel/events.js"; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = n || {}; var o = document.createElement("script"); o.type = "text/javascript"; o.async = !0; o.src = i + "?sdkid=" + e + "&lib=" + t; var a = document.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a); };
    })(window, document, "ttq");
    window.ttq.load(pixelId);
    window.ttq.page();
}

/**
 * Wczytywanie cennika: priorytetowo z data/pricing.json,
 * a w razie braku z globalnego window.PRICING_DATA (pricing.js).
 */
function loadPricing() {
    const tableWrapper = document.getElementById("pricing-table-vehicles");
    const extrasContainer = document.getElementById("pricing-extras-list");
    const winterContainer = document.getElementById("pricing-winter-list");

    if (!tableWrapper) return;

    fetch("data/pricing.json", { cache: "no-store" })
        .then(function (response) {
            if (!response.ok) throw new Error("Brak pliku pricing.json");
            return response.json();
        })
        .then(function (data) {
            renderPricing(data, tableWrapper, extrasContainer, winterContainer);
        })
        .catch(function () {
            if (window.PRICING_DATA) {
                renderPricing(window.PRICING_DATA, tableWrapper, extrasContainer, winterContainer);
            } else {
                tableWrapper.innerHTML = "<div class=\"pricing-loading\">Nie udało się wczytać cennika. Skontaktuj się z nami w celu poznania aktualnych cen.</div>";
            }
        });
}

function renderPricing(data, tableWrapper, extrasContainer, winterContainer) {
    if (!data) return;

    const categories = data.categories || [];
    const tables = data.tables || (data.services ? [{ title: "Cennik", items: data.services }] : []);

    if (tables.length && categories.length) {
        buildPricingTables(tableWrapper, categories, tables);
    }

    if (data.singleItems && extrasContainer) {
        if (data.singleItems.length) {
            buildExtrasList(extrasContainer, data.singleItems);
        } else {
            extrasContainer.innerHTML = "<p class=\"pricing-loading\">Dodaj dodatkowe usługi w pliku data/pricing.json.</p>";
        }
    } else if (data.extras && extrasContainer) {
        buildLegacyExtrasList(extrasContainer, data.extras);
    }

    if (data.winterPackages && winterContainer) {
        buildWinterPackages(winterContainer, data.winterPackages);
    }
}

function formatPrice(value) {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "number") return value + " zł";
    return String(value);
}

function buildPricingTables(wrapper, categories, tables) {
    wrapper.innerHTML = "";

    tables.forEach(function (tableData) {
        const block = document.createElement("div");
        block.className = "pricing-table-block";

        if (tableData.title) {
            const h4 = document.createElement("h4");
            h4.textContent = tableData.title;
            block.appendChild(h4);
        }

        const table = document.createElement("table");
        table.className = "pricing-table";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");

        const thService = document.createElement("th");
        thService.textContent = "Usługa";
        headRow.appendChild(thService);

        categories.forEach(function (cat) {
            const th = document.createElement("th");
            th.textContent = cat;
            headRow.appendChild(th);
        });

        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        (tableData.items || []).forEach(function (item) {
            const tr = document.createElement("tr");
            const tdName = document.createElement("td");

            const nameWrap = document.createElement("div");
            nameWrap.className = "pricing-name";
            nameWrap.textContent = item.name;
            tdName.appendChild(nameWrap);

            if (item.note) {
                const note = document.createElement("div");
                note.className = "pricing-note";
                note.textContent = item.note;
                tdName.appendChild(note);
            }

            tr.appendChild(tdName);

            const prices = item.prices || [];
            categories.forEach(function (_, idx) {
                const td = document.createElement("td");
                td.textContent = formatPrice(prices[idx]);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);

        const scroller = document.createElement("div");
        scroller.className = "pricing-table-scroll";
        scroller.appendChild(table);

        block.appendChild(scroller);
        wrapper.appendChild(block);
    });
}

function buildExtrasList(container, extras) {
    container.innerHTML = "";
    extras.forEach(function (extra) {
        const item = document.createElement("article");
        item.className = "pricing-extra-item";

        const name = document.createElement("h4");
        name.className = "pricing-extra-name";
        name.textContent = extra.name;

        const price = document.createElement("div");
        price.className = "pricing-extra-price";
        price.textContent = extra.price || "-";

        item.appendChild(name);
        item.appendChild(price);

        if (extra.note) {
            const note = document.createElement("p");
            note.className = "pricing-extra-note";
            note.textContent = extra.note;
            item.appendChild(note);
        }

        container.appendChild(item);
    });
}

function buildLegacyExtrasList(container, extras) {
    container.innerHTML = "";
    extras.forEach(function (extra) {
        const item = document.createElement("div");
        item.className = "pricing-extra-item";

        const name = document.createElement("span");
        name.className = "pricing-extra-name";
        name.textContent = extra.name;

        const note = document.createElement("span");
        note.className = "pricing-extra-note";
        note.textContent = extra.note || "";

        item.appendChild(name);
        item.appendChild(note);
        container.appendChild(item);
    });
}

function buildWinterPackages(container, winterPackages) {
    container.innerHTML = "";
    winterPackages.forEach(function (pack) {
        const item = document.createElement("div");
        item.className = "pricing-winter-item";
        const name = document.createElement("strong");
        name.textContent = pack.name + ": ";
        const desc = document.createElement("span");
        desc.textContent = pack.description;

        item.appendChild(name);
        item.appendChild(desc);
        container.appendChild(item);
    });
}

/**
 * Ładowanie 5-gwiazdkowych opinii Google z pliku JSON (data/reviews.json)
 */
function loadGoogleReviews() {
    const container = document.getElementById("reviews-container");
    if (!container) return;

    const endpoint = container.getAttribute("data-endpoint") || "data/reviews.json";
    const apiKey = container.getAttribute("data-api-key") || GOOGLE_API_KEY;
    const placeId = container.getAttribute("data-place-id") || DEFAULT_PLACE_ID;
    const hasLiveGoogle = Boolean(apiKey && placeId);

    function readCache() {
        try {
            const raw = localStorage.getItem(REVIEWS_CACHE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || parsed.placeId !== placeId) return null;
            if (Date.now() - parsed.ts > REVIEWS_CACHE_TTL) return null;
            return parsed;
        } catch (e) {
            return null;
        }
    }

    function writeCache(reviews, placeUrl) {
        try {
            localStorage.setItem(REVIEWS_CACHE_KEY, JSON.stringify({
                ts: Date.now(),
                placeId: placeId,
                placeUrl: placeUrl || "",
                reviews: reviews
            }));
        } catch (e) {
            /* ignore quota issues */
        }
    }

    function rotateReviews(list, maxToShow) {
        if (!Array.isArray(list) || list.length === 0) return [];
        const limit = typeof maxToShow === "number" ? maxToShow : 3;
        const indexKey = `${REVIEWS_CACHE_KEY}:idx:${placeId}`;
        let start = 0;
        try {
            start = parseInt(localStorage.getItem(indexKey), 10) || 0;
        } catch (e) {
            start = 0;
        }

        const slice = [];
        for (let i = 0; i < Math.min(limit, list.length); i++) {
            slice.push(list[(start + i) % list.length]);
        }

        try {
            localStorage.setItem(indexKey, ((start + limit) % list.length).toString());
        } catch (e) {
            /* ignore */
        }

        return slice;
    }

    function renderWithFallback() {
        fetch(endpoint, { cache: "no-store" })
            .then(function (response) {
                if (!response.ok) throw new Error("Brak danych opinii");
                return response.json();
            })
            .then(function (data) {
                const payload = Array.isArray(data) ? data : [];
                if (payload.length === 0) {
                    renderReviews(container, REVIEWS_FALLBACK, 3, REVIEWS_FALLBACK);
                } else {
                    renderReviews(container, payload, 3, REVIEWS_FALLBACK);
                }
            })
            .catch(function () {
                renderReviews(container, REVIEWS_FALLBACK, 3, REVIEWS_FALLBACK);
            });
    }

    const cached = readCache();
    if (cached && Array.isArray(cached.reviews) && cached.reviews.length) {
        const rotated = rotateReviews(cached.reviews, 3);
        renderReviews(container, rotated, 3, null, { allowFallback: false, requireProfilePhoto: false });
        return;
    }

    function loadMapsScript(key) {
        if (window.google && window.google.maps && window.google.maps.places) {
            return Promise.resolve();
        }
        if (googleMapsScriptPromise) return googleMapsScriptPromise;

        const src = "https://maps.googleapis.com/maps/api/js?" +
            "key=" + encodeURIComponent(key) +
            "&libraries=places";

        googleMapsScriptPromise = new Promise(function (resolve, reject) {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.defer = true;
            script.onload = function () { resolve(); };
            script.onerror = function () { reject(new Error("Nie udało się załadować Google Maps JS")); };
            document.head.appendChild(script);
        });

        return googleMapsScriptPromise;
    }

    function fetchGooglePlacesReviews(key, id) {
        return loadMapsScript(key).then(function () {
            if (!(window.google && window.google.maps && window.google.maps.places)) {
                throw new Error("Brak biblioteki Google Places");
            }

            const sorts = [null, google.maps.places.ReviewSortOrder.NEWEST];

            return new Promise(function (resolve, reject) {
                const service = new google.maps.places.PlacesService(document.createElement("div"));
                const allReviews = [];
                let placeUrl = "";
                let completed = 0;
                let hadSuccess = false;

                function handleResult(result, status) {
                    completed += 1;

                    if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                        hadSuccess = true;
                        placeUrl = placeUrl || result.url || "";
                        if (Array.isArray(result.reviews)) {
                            allReviews.push.apply(allReviews, result.reviews);
                        }
                    }

                    if (completed === sorts.length) {
                        if (hadSuccess) {
                            resolve({ reviews: allReviews, placeUrl: placeUrl });
                        } else {
                            reject(new Error("Status Google Places: " + status));
                        }
                    }
                }

                sorts.forEach(function (sortValue) {
                    service.getDetails(
                        {
                            placeId: id,
                            fields: ["reviews", "url", "user_ratings_total"],
                            reviewsSort: sortValue
                        },
                        handleResult
                    );
                });
            });
        });
    }

    function fetchGooglePlacesReviewsRest(key, id) {
        const sorts = ["most_relevant", "newest"];
        const allReviews = [];
        let placeUrl = "";

        return Promise.all(
            sorts.map(function (sort) {
                const params = new URLSearchParams({
                    place_id: id,
                    key: key,
                    fields: "reviews,url",
                    reviews_sort: sort,
                    reviews_no_translations: "true"
                });

                return fetch("https://maps.googleapis.com/maps/api/place/details/json?" + params.toString())
                    .then(function (response) {
                        if (!response.ok) throw new Error("HTTP " + response.status);
                        return response.json();
                    })
                    .then(function (payload) {
                        if (payload.status !== "OK" || !payload.result) return;

                        placeUrl = placeUrl || payload.result.url || "";
                        if (Array.isArray(payload.result.reviews)) {
                            allReviews.push.apply(allReviews, payload.result.reviews);
                        }
                    })
                    .catch(function () {
                        /* ignorujemy pojedyncze błędy zapytań REST */
                    });
            })
        ).then(function () {
            if (allReviews.length === 0) {
                throw new Error("Brak recenzji z REST");
            }
            return { reviews: allReviews, placeUrl: placeUrl };
        });
    }

    function normalizeReviews(payload) {
        const unique = [];
        const seenKeys = new Set();

        (payload.reviews || []).forEach(function (rev) {
            const key = (rev.author_name || "") + "|" + (rev.text || rev.relative_time_description || "");
            if (seenKeys.has(key)) return;
            seenKeys.add(key);

            unique.push({
                author_name: rev.author_name,
                rating: rev.rating,
                relative_time_description: rev.relative_time_description,
                text: rev.text,
                profile_photo_url: rev.profile_photo_url || DEFAULT_GOOGLE_AVATAR,
                url: rev.author_url || payload.placeUrl
            });
        });

        return unique;
    }

    if (hasLiveGoogle) {
        fetchGooglePlacesReviewsRest(apiKey, placeId)
            .catch(function () {
                return fetchGooglePlacesReviews(apiKey, placeId);
            })
            .then(function (payload) {
                if (!payload || !Array.isArray(payload.reviews) || payload.reviews.length === 0) {
                    throw new Error("Brak danych recenzji");
                }

                const normalized = normalizeReviews(payload);
                writeCache(normalized, payload.placeUrl || "");
                const rotated = rotateReviews(normalized, 3);
                renderReviews(container, rotated, 3, null, { requireProfilePhoto: false, allowFallback: false });
            })
            .catch(function () {
                container.innerHTML = "<p class=\"reviews-loading\">Nie udało się pobrać opinii z Google.</p>";
            });
    } else {
        renderWithFallback();
    }
}

function renderReviews(container, reviews, limit, fallbackReviews, options) {
    const opts = Object.assign({ requireProfilePhoto: false, allowFallback: true }, options);
    const fiveStars = (reviews || []).filter(function (review) {
        const hasPhoto = !opts.requireProfilePhoto || Boolean(review.profile_photo_url || DEFAULT_GOOGLE_AVATAR);
        return Number(review.rating) === 5 && hasPhoto;
    });

    const maxToShow = typeof limit === "number" ? limit : 6;

    if (opts.allowFallback && fiveStars.length < maxToShow && Array.isArray(fallbackReviews)) {
        const usedKeys = new Set(
            fiveStars.map(function (review) {
                return (review.author_name || "") + "|" + (review.text || "");
            })
        );

        fallbackReviews.some(function (review) {
            if (fiveStars.length >= maxToShow) return true;
            if (Number(review.rating) !== 5) return false;

            const key = (review.author_name || "") + "|" + (review.text || "");
            if (usedKeys.has(key)) return false;

            usedKeys.add(key);
            fiveStars.push(review);
            return false;
        });
    }

    if (fiveStars.length === 0) {
        container.innerHTML = "<p class=\"reviews-loading\">Brak opinii 5★ do wyświetlenia.</p>";
        return;
    }

    container.innerHTML = "";

    fiveStars.slice(0, maxToShow).forEach(function (review) {
        const card = document.createElement("article");
        card.className = "review-card";

        const header = document.createElement("header");
        header.className = "review-header";

        const avatar = document.createElement("div");
        avatar.className = "review-avatar";
        const img = document.createElement("img");
        img.src = review.profile_photo_url || DEFAULT_GOOGLE_AVATAR;
        img.alt = "Zdjęcie profilowe " + (review.author_name || "użytkownika");
        avatar.appendChild(img);

        const meta = document.createElement("div");
        meta.className = "review-meta";
        const author = document.createElement("strong");
        author.textContent = review.author_name || "Anonim";
        const time = document.createElement("span");
        time.textContent = review.relative_time_description || "Niedawno";

        meta.appendChild(author);
        meta.appendChild(time);

        const badge = document.createElement("span");
        badge.className = "review-source";
        badge.textContent = "Google ★★★★★";

        header.appendChild(avatar);
        header.appendChild(meta);
        header.appendChild(badge);

        const text = document.createElement("p");
        text.className = "review-text";
        text.textContent = review.text || "Brak treści opinii";

        const rating = document.createElement("p");
        rating.className = "review-rating";
        rating.setAttribute("aria-label", "Ocena 5 na 5");
        rating.textContent = "★★★★★";

        if (review.url) {
            const link = document.createElement("a");
            link.href = review.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "review-link";
            link.textContent = "Zobacz na Google";
            rating.appendChild(link);
        }

        card.appendChild(header);
        card.appendChild(text);
        card.appendChild(rating);
        container.appendChild(card);
    });
}

function initTeamFallbacks() {
    const imgs = document.querySelectorAll(".team-photo img[data-fallback]");
    imgs.forEach(function (img) {
        const fallback = img.getAttribute("data-fallback");
        if (!fallback) return;

        function useFallback() {
            if (img.dataset.loadedFallback) return;
            img.dataset.loadedFallback = "true";
            img.src = fallback;
        }

        img.addEventListener("error", useFallback);

        if (img.complete && img.naturalWidth === 0) {
            useFallback();
        }
    });
}
