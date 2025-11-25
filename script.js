// Google Places - produkcyjny Place ID podany przez klienta
const DEFAULT_PLACE_ID = "ChIJ2SfIvVHLHkcRGovfOkM8RYo";
const GOOGLE_API_KEY = "AIzaSyBBEGLuDhhYTF23KVnBC4XZa_KmTWQaZFs";
const DEFAULT_GOOGLE_AVATAR = "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/user_circle.png";

// Loader skryptu Google Maps JS (Places) współdzielony między wywołaniami
let googleMapsScriptPromise = null;
const REVIEWS_FALLBACK = [
    {
        author_name: "Mateusz K.",
        rating: 5,
        relative_time_description: "2 tygodnie temu",
        text: "Błyskawicznie ogarnęli pianę aktywną, felgi i wnętrze. Auto wygląda lepiej niż po odbiorze z salonu.",
        profile_photo_url: "https://lh3.googleusercontent.com/a-/AOh14GjDemoMateusz",
        url: "https://www.google.com/maps/place/auto+detailing+bydgoszcz"
    },
    {
        author_name: "Karolina D.",
        rating: 5,
        relative_time_description: "miesiąc temu",
        text: "Świetne podejście do klienta i zero kompromisów przy myciu ręcznym. Lakier zyskał głębię i szklistość.",
        profile_photo_url: "https://lh3.googleusercontent.com/a-/AOh14GjDemoKarolina",
        url: "https://www.google.com/maps/place/myjnia+detailingowa"
    },
    {
        author_name: "Piotr L.",
        rating: 5,
        relative_time_description: "3 miesiące temu",
        text: "Wnętrze po praniu tapicerki pachnie świeżością, a plastiki są satynowe, nie tłuste. Polecam!",
        profile_photo_url: "https://lh3.googleusercontent.com/a-/AOh14GjDemoPiotr",
        url: "https://www.google.com/maps/place/fabryka+blysku"
    },
    {
        author_name: "Ewa R.",
        rating: 5,
        relative_time_description: "tydzień temu",
        text: "Ceramiczna ochrona lakieru nałożona perfekcyjnie. Woda spływa jak po kropelkach, a auto łatwo się myje.",
        profile_photo_url: "https://lh3.googleusercontent.com/a-/AOh14GjDemoEwa",
        url: "https://www.google.com/maps/place/myjnia+premium"
    },
    {
        author_name: "Rafał P.",
        rating: 5,
        relative_time_description: "5 dni temu",
        text: "Szybka dekontaminacja, dressing opon i wosk sezonowy. Warto było przyjechać z drugiego końca miasta.",
        profile_photo_url: "https://lh3.googleusercontent.com/a-/AOh14GjDemoRafal",
        url: "https://www.google.com/maps/place/myjnia+samochodowa"
    },
    {
        author_name: "Natalia S.",
        rating: 5,
        relative_time_description: "4 dni temu",
        text: "Auto po detailingu wygląda jak nowe, a wnętrze pachnie świeżo. Profesjonalna obsługa i fajne podejście.",
        profile_photo_url: "https://lh3.googleusercontent.com/a-/AOh14GjDemoNatalia",
        url: "https://www.google.com/maps/place/studio+detailingowe"
    }
];

// script.js - logika interfejsu Fabryka Błysku

document.addEventListener("DOMContentLoaded", function () {
    setupSmoothScroll();
    setupMobileMenu();
    setupIntersectionObserver();
    setupContactFormHandling();
    setCurrentYear();
    initCookieBanner();
    loadPricing();
    loadGoogleReviews();
    initHeroBubbles();
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

    if (data.categories && data.services) {
        buildVehiclePricingTable(tableWrapper, data.categories, data.services);
    }

    if (data.extras && extrasContainer) {
        buildExtrasList(extrasContainer, data.extras);
    }

    if (data.winterPackages && winterContainer) {
        buildWinterPackages(winterContainer, data.winterPackages);
    }
}

function buildVehiclePricingTable(wrapper, categories, services) {
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

    services.forEach(function (service) {
        const tr = document.createElement("tr");
        const tdName = document.createElement("td");
        tdName.textContent = service.name;
        tr.appendChild(tdName);

        (service.prices || []).forEach(function (price) {
            const td = document.createElement("td");
            if (price === null || price === undefined || price === "") {
                td.textContent = "-";
            } else {
                td.textContent = String(price) + " zł";
            }
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.innerHTML = "";
    wrapper.appendChild(table);
}

function buildExtrasList(container, extras) {
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

            return new Promise(function (resolve, reject) {
                const service = new google.maps.places.PlacesService(document.createElement("div"));

                service.getDetails(
                    {
                        placeId: id,
                        fields: ["reviews", "url", "user_ratings_total"]
                    },
                    function (result, status) {
                        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                            resolve({
                                reviews: Array.isArray(result.reviews) ? result.reviews : [],
                                placeUrl: result.url
                            });
                        } else {
                            reject(new Error("Status Google Places: " + status));
                        }
                    }
                );
            });
        });
    }

    if (apiKey && placeId) {
        fetchGooglePlacesReviews(apiKey, placeId)
            .then(function (payload) {
                if (!payload || !Array.isArray(payload.reviews) || payload.reviews.length === 0) {
                    renderReviews(container, [], 3, null, { requireProfilePhoto: true, allowFallback: false });
                    return;
                }

                const normalized = payload.reviews.map(function (rev) {
                    return {
                        author_name: rev.author_name,
                        rating: rev.rating,
                        relative_time_description: rev.relative_time_description,
                        text: rev.text,
                        profile_photo_url: rev.profile_photo_url || DEFAULT_GOOGLE_AVATAR,
                        url: rev.author_url || payload.placeUrl
                    };
                });

                renderReviews(container, normalized, 3, null, { requireProfilePhoto: true, allowFallback: false });
            })
            .catch(function () {
                renderWithFallback();
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

/**
 * Animacja pianowych baniek w hero oparta o canvas (lekka i responsywna)
 */
function initHeroBubbles() {
    const canvas = document.getElementById("bubbles-canvas");
    const hero = document.querySelector(".hero");

    if (!canvas || !hero || !canvas.getContext) return;

    const ctx = canvas.getContext("2d");
    const bubbles = [];
    const mouse = { x: 0, y: 0, isDown: false, hasMoved: false };
    const fpsSamples = [];

    const CONFIG = {
        targetDensity: 38 / (1920 * 1080),
        globalMinBubbles: 18,
        globalMaxBubbles: 74,
        baseSpawnInterval: 0.2,
        minRadius: 12,
        maxRadius: 52,
        minInitialVy: -22,
        maxInitialVy: -86,
        maxInitialVx: 24,
        baseBuoyancy: -16,
        dragSmall: 0.02,
        dragLarge: 0.08,
        baseTurbulence: 32,
        minLifetime: 7.5,
        maxLifetime: 17,
        minPopDuration: 0.12,
        maxPopDuration: 0.22,
        pulseAmplitude: 0.06,
        pulseSpeedMin: 1.1,
        pulseSpeedMax: 2.3,
        baseAlphaMin: 0.38,
        baseAlphaMax: 0.72,
        lowFpsThreshold: 42
    };

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let targetMaxBubbles = CONFIG.globalMinBubbles;
    let spawnAccumulator = 0;
    let lastTimestamp = performance.now();

    function resizeCanvas() {
        const rect = hero.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        recalcTargetBubbles();
    }

    function recalcTargetBubbles() {
        const area = width * height;
        const ideal = area * CONFIG.targetDensity;
        targetMaxBubbles = Math.round(
            Math.max(CONFIG.globalMinBubbles, Math.min(CONFIG.globalMaxBubbles, ideal))
        );
    }

    function randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    class Bubble {
        constructor(x, y, radius) {
            this.x = x;
            this.y = y;
            this.baseRadius = radius;
            this.radius = radius;

            const sizeFactor = CONFIG.maxRadius / radius;
            this.vx = randomRange(-CONFIG.maxInitialVx, CONFIG.maxInitialVx) * Math.min(sizeFactor, 2.2);
            this.vy = randomRange(CONFIG.minInitialVy, CONFIG.maxInitialVy) * Math.min(sizeFactor, 2.4);

            const buoyancyScale = Math.min(1.7, Math.pow(sizeFactor, 0.58));
            this.buoyancy = CONFIG.baseBuoyancy * buoyancyScale;

            const sizeT = (radius - CONFIG.minRadius) / (CONFIG.maxRadius - CONFIG.minRadius);
            this.drag = CONFIG.dragLarge * sizeT + CONFIG.dragSmall * (1 - sizeT);

            this.turbulence = CONFIG.baseTurbulence * Math.min(sizeFactor, 2.3);
            this.age = 0;
            this.maxAge = randomRange(CONFIG.minLifetime, CONFIG.maxLifetime);
            this.popHeight = randomRange(height * 0.04, height * 0.16);

            this.pulseSpeed = randomRange(CONFIG.pulseSpeedMin, CONFIG.pulseSpeedMax);
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.baseAlpha = randomRange(CONFIG.baseAlphaMin, CONFIG.baseAlphaMax);
            this.hue = randomRange(187, 202);

            // --- NOWE: Generowanie struktury piany (wewnętrzne "chmurki") ---
            this.foamSegments = [];
            const segmentCount = Math.floor(3 + Math.random() * 3);
            for (let i = 0; i < segmentCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = radius * (0.2 + Math.random() * 0.4);
                this.foamSegments.push({
                    dx: Math.cos(angle) * dist,
                    dy: Math.sin(angle) * dist,
                    r: radius * (0.3 + Math.random() * 0.3),
                    alpha: 0.05 + Math.random() * 0.15
                });
            }

            // --- NOWE: Zmienne do obsługi pękania ---
            this.shards = null;
            this.state = "alive";
            this.popTime = 0;
            this.popDuration = 0.4;
            this.hasQueuedPop = false;
        }

        startPop() {
            if (this.state !== "popping") {
                this.state = "popping";
                this.popTime = 0;

                this.shards = [];
                const shardCount = Math.floor(this.baseRadius / 2) + 8;

                for (let i = 0; i < shardCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 30 + Math.random() * 50;
                    this.shards.push({
                        x: this.x + Math.cos(angle) * this.baseRadius * 0.8,
                        y: this.y + Math.sin(angle) * this.baseRadius * 0.8,
                        vx: this.vx + Math.cos(angle) * speed,
                        vy: this.vy + Math.sin(angle) * speed,
                        size: 1 + Math.random() * 2,
                        life: 1.0
                    });
                }
            }
        }

        update(dt) {
            if (this.state === "popping") {
                this.popTime += dt;
                if (this.shards) {
                    for (let s of this.shards) {
                        s.x += s.vx * dt;
                        s.y += s.vy * dt;
                        s.vy += 200 * dt;
                        s.life -= dt * 2.5;
                    }
                }
                if (this.popTime >= this.popDuration) return false;
                return true;
            }

            this.age += dt;

            if (this.y <= this.popHeight || this.y < -this.radius || (this.age > this.maxAge && this.y < height * 0.3)) {
                this.startPop();
            }

            if (!this.hasQueuedPop && this.age > this.maxAge * 0.55 && Math.random() < dt * 0.6) {
                this.hasQueuedPop = true;
                this.startPop();
            }

            this.vx += (Math.random() - 0.5) * this.turbulence * dt;
            this.vy += (Math.random() - 0.5) * this.turbulence * 0.32 * dt;
            this.vy += this.buoyancy * dt;

            this.vx *= 1 - this.drag * dt;
            this.vy *= 1 - this.drag * dt;

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            return true;
        }

        draw(ctx) {
            if (this.state === "popping") {
                const progress = this.popTime / this.popDuration;

                if (this.shards) {
                    ctx.fillStyle = "#ffffff";
                    for (let s of this.shards) {
                        if (s.life > 0) {
                            ctx.globalAlpha = s.life;
                            ctx.beginPath();
                            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }

                if (progress < 0.5) {
                    ctx.globalAlpha = 1 - progress * 2;
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius * (1 + progress), 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.globalAlpha = 1.0;
                return;
            }

            let alpha = 1.0;
            if (this.age < 0.5) alpha = this.age / 0.5;
            else if (this.age > this.maxAge - 1) alpha = this.maxAge - this.age;
            if (alpha <= 0) return;

            const gradient = ctx.createRadialGradient(
                this.x,
                this.y,
                this.radius * 0.6,
                this.x,
                this.y,
                this.radius
            );
            gradient.addColorStop(0, "rgba(255, 255, 255, 0.0)");
            gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.1)");
            gradient.addColorStop(1, "rgba(255, 255, 255, 0.25)");

            ctx.globalAlpha = alpha;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            for (let seg of this.foamSegments) {
                ctx.fillStyle = `rgba(255, 255, 255, ${seg.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x + seg.dx, this.y + seg.dy, seg.r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();

            const glareX = this.x - this.radius * 0.4;
            const glareY = this.y - this.radius * 0.4;

            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.ellipse(glareX, glareY, this.radius * 0.25, this.radius * 0.15, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1.0;
        }
    }

    function spawnBubble() {
        const radius = randomRange(CONFIG.minRadius, CONFIG.maxRadius);
        const x = randomRange(radius, width - radius);
        const y = height + radius + randomRange(0, 30);
        bubbles.push(new Bubble(x, y, radius));
    }

    function getAverageFps() {
        if (!fpsSamples.length) return 60;
        const sum = fpsSamples.reduce((acc, v) => acc + v, 0);
        return sum / fpsSamples.length;
    }

    function loop(timestamp) {
        requestAnimationFrame(loop);

        let dt = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;
        if (dt > 0.05) dt = 0.05;

        const fps = 1 / dt;
        fpsSamples.push(fps);
        if (fpsSamples.length > 60) fpsSamples.shift();

        const avgFps = getAverageFps();
        let effectiveTargetBubbles = targetMaxBubbles;
        let spawnInterval = CONFIG.baseSpawnInterval;

        if (avgFps < CONFIG.lowFpsThreshold) {
            effectiveTargetBubbles = Math.max(CONFIG.globalMinBubbles, Math.round(targetMaxBubbles * 0.72));
            spawnInterval *= 1.35;
        }

        spawnAccumulator += dt;
        while (spawnAccumulator >= spawnInterval && bubbles.length < effectiveTargetBubbles) {
            spawnBubble();
            spawnAccumulator -= spawnInterval;
        }

        for (let i = bubbles.length - 1; i >= 0; i--) {
            const alive = bubbles[i].update(dt);
            if (!alive) bubbles.splice(i, 1);
        }

        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        bubbles.forEach((bubble) => bubble.draw(ctx));
        ctx.restore();
    }

    function updateMousePosition(event) {
        const rect = hero.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
        mouse.hasMoved = true;
    }

    hero.addEventListener("pointermove", updateMousePosition);
    hero.addEventListener("pointerdown", function () { mouse.isDown = true; });
    hero.addEventListener("pointerup", function () { mouse.isDown = false; });
    hero.addEventListener("pointerleave", function () { mouse.hasMoved = false; mouse.isDown = false; });

    const resizeObserver = window.ResizeObserver ? new ResizeObserver(resizeCanvas) : null;
    if (resizeObserver) resizeObserver.observe(hero);
    window.addEventListener("resize", resizeCanvas);

    resizeCanvas();
    requestAnimationFrame(loop);

    for (let i = 0; i < CONFIG.globalMinBubbles; i++) {
        spawnBubble();
    }
}
