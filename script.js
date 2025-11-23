// Google Places - docelowo opinie z wizytówki Google
// TODO: po uruchomieniu własnej wizytówki Fabryki Błysku podmień PLACE_ID na swoje
const PLACE_ID = "ChIJe103_2QzGUcRIfVGtLDCsEM";

// Jeśli kiedyś dodasz backend lub klucz Google API, możesz użyć PLACE_ID
// do pobierania prawdziwych opinii. Obecnie sekcja opinii jest statyczna.

// script.js - logika interfejsu Fabryka Błysku

document.addEventListener("DOMContentLoaded", function () {
    setupSmoothScroll();
    setupMobileMenu();
    setupIntersectionObserver();
    setupContactFormHandling();
    setCurrentYear();
    initCookieBanner();
    loadPricingFromJS();
    loadGoogleReviews();
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
        return;
    }

    banner.style.display = "flex";
    acceptBtn.addEventListener("click", function () {
        localStorage.setItem(storageKey, "accepted");
        banner.style.display = "none";
    });
}

/**
 * Wczytywanie cennika z pricing.js (globalne window.PRICING_DATA)
 * działa zarówno lokalnie, jak i na serwerze.
 */
function loadPricingFromJS() {
    const tableWrapper = document.getElementById("pricing-table-vehicles");
    const extrasContainer = document.getElementById("pricing-extras-list");
    const winterContainer = document.getElementById("pricing-winter-list");

    if (!tableWrapper) return;

    const data = window.PRICING_DATA;
    if (!data) {
        tableWrapper.innerHTML = "<div class=\"pricing-loading\">Nie udało się wczytać cennika. Skontaktuj się z nami w celu poznania aktualnych cen.</div>";
        return;
    }

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

    fetch("data/reviews.json", { cache: "no-store" })
        .then(function (response) {
            if (!response.ok) throw new Error("Brak danych opinii");
            return response.json();
        })
        .then(function (data) {
            renderReviews(container, data);
        })
        .catch(function () {
            container.innerHTML = "<p class=\"reviews-loading\">Nie udało się pobrać opinii Google. Odśwież stronę lub sprawdź połączenie.</p>";
        });
}

function renderReviews(container, reviews) {
    const fiveStars = (reviews || []).filter(function (review) {
        return Number(review.rating) === 5;
    });

    if (fiveStars.length === 0) {
        container.innerHTML = "<p class=\"reviews-loading\">Brak opinii 5★ do wyświetlenia.</p>";
        return;
    }

    container.innerHTML = "";

    fiveStars.slice(0, 6).forEach(function (review) {
        const card = document.createElement("article");
        card.className = "review-card";

        const header = document.createElement("header");
        header.className = "review-header";

        const avatar = document.createElement("div");
        avatar.className = "review-avatar";
        if (review.profile_photo_url) {
            const img = document.createElement("img");
            img.src = review.profile_photo_url;
            img.alt = "Zdjęcie profilowe " + review.author_name;
            avatar.appendChild(img);
        } else {
            avatar.textContent = "★";
        }

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
