const GALLERY_FOLDER = "assets/img/gallery/";
const GALLERY_MANIFEST_URL = "data/gallery.json";
const SUPPORTED_EXTENSIONS = ["webp", "avif", "jpg", "jpeg", "png"];
const DISCOVERY_LIMIT = 24;

const galleryState = {
    images: [],
    current: 0,
    autoTimer: null,
    autoDelay: 5500,
    isPaused: false,
};

document.addEventListener("DOMContentLoaded", function () {
    initGallery();
});

async function initGallery() {
    const slider = document.getElementById("gallery-slider");
    const thumbsContainer = document.getElementById("gallery-thumbs");

    if (!slider || !thumbsContainer) return;

    bindNavigation(slider);
    bindViewSwitch();

    galleryState.images = await resolveImages();

    if (galleryState.images.length === 0) {
        thumbsContainer.innerHTML = "<p class=\"gallery-empty\">Brak zdjęć do wyświetlenia.</p>";
        slider.style.display = "none";
        return;
    }

    renderThumbnails(galleryState.images);
    renderDots(galleryState.images.length);
    switchView("slider");
    showSlide(0);
    startAuto();

    window.addEventListener("resize", function () {
        const sliderCurrent = document.getElementById("gallery-slider");
        const imageCurrent = document.getElementById("gallery-active-image");
        updateAspectRatio(sliderCurrent, imageCurrent);
    });
}

function bindNavigation(slider) {
    slider.addEventListener("click", function (event) {
        const dir = event.target.getAttribute("data-direction");
        if (!dir) return;
        if (dir === "next") {
            nextSlide();
        } else {
            prevSlide();
        }
        restartAuto();
    });

    slider.addEventListener("mouseenter", function () {
        galleryState.isPaused = true;
        stopAuto();
    });

    slider.addEventListener("mouseleave", function () {
        galleryState.isPaused = false;
        restartAuto();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight") {
            nextSlide();
            restartAuto();
        }
        if (event.key === "ArrowLeft") {
            prevSlide();
            restartAuto();
        }
    });
}

function bindViewSwitch() {
    const chips = document.querySelectorAll(".gallery-chip");
    chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
            const view = chip.getAttribute("data-view");
            switchView(view);
        });
    });
}

function switchView(view) {
    const slider = document.getElementById("gallery-slider");
    const thumbs = document.getElementById("gallery-thumbs");
    const chips = document.querySelectorAll(".gallery-chip");

    chips.forEach(function (chip) {
        chip.classList.toggle("is-active", chip.getAttribute("data-view") === view);
    });

    if (view === "grid") {
        slider.style.display = "none";
        thumbs.style.display = "grid";
        stopAuto();
    } else {
        slider.style.display = "grid";
        thumbs.style.display = "grid";
        restartAuto();
    }
}

function renderThumbnails(images) {
    const container = document.getElementById("gallery-thumbs");
    if (!container) return;

    container.innerHTML = "";

    images.forEach(function (img, index) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gallery-thumb";
        button.setAttribute("aria-label", "Otwórz zdjęcie " + (index + 1));
        button.addEventListener("click", function () {
            switchView("slider");
            showSlide(index);
            restartAuto();
        });

        const imageEl = document.createElement("img");
        imageEl.src = img.src;
        imageEl.alt = img.alt;

        button.appendChild(imageEl);
        container.appendChild(button);
    });
}

function renderDots(count) {
    const dots = document.getElementById("gallery-dots");
    if (!dots) return;
    dots.innerHTML = "";
    for (let i = 0; i < count; i += 1) {
        const dot = document.createElement("span");
        dot.className = "gallery-dot";
        dot.addEventListener("click", function () {
            showSlide(i);
            restartAuto();
        });
        dots.appendChild(dot);
    }
}

function showSlide(index) {
    if (galleryState.images.length === 0) return;
    if (index < 0) index = galleryState.images.length - 1;
    if (index >= galleryState.images.length) index = 0;

    galleryState.current = index;
    const active = galleryState.images[index];

    const imageEl = document.getElementById("gallery-active-image");
    const counterEl = document.getElementById("gallery-counter");
    const nameEl = document.getElementById("gallery-name");
    const slider = document.getElementById("gallery-slider");

    if (!imageEl || !counterEl || !nameEl || !slider) return;

    imageEl.src = active.src;
    imageEl.alt = active.alt;

    imageEl.onload = function () {
        updateAspectRatio(slider, imageEl);
    };

    counterEl.textContent = (index + 1) + "/" + galleryState.images.length;
    nameEl.textContent = active.label || active.alt;

    updateActiveThumb(index);
    updateActiveDot(index);
}

function updateActiveThumb(index) {
    const thumbs = document.querySelectorAll(".gallery-thumb");
    thumbs.forEach(function (thumb, idx) {
        thumb.classList.toggle("is-active", idx === index);
    });
}

function updateActiveDot(index) {
    const dots = document.querySelectorAll(".gallery-dot");
    dots.forEach(function (dot, idx) {
        dot.classList.toggle("is-active", idx === index);
    });
}

function nextSlide() {
    showSlide(galleryState.current + 1);
}

function prevSlide() {
    showSlide(galleryState.current - 1);
}

function startAuto() {
    if (galleryState.autoTimer || galleryState.images.length < 2) return;
    galleryState.autoTimer = setInterval(function () {
        nextSlide();
    }, galleryState.autoDelay);
}

function stopAuto() {
    if (!galleryState.autoTimer) return;
    clearInterval(galleryState.autoTimer);
    galleryState.autoTimer = null;
}

function restartAuto() {
    stopAuto();
    if (!galleryState.isPaused) {
        startAuto();
    }
}

function updateAspectRatio(slider, imageEl) {
    if (!slider || !imageEl || !imageEl.naturalWidth || !imageEl.naturalHeight) return;
    const ratio = imageEl.naturalWidth / imageEl.naturalHeight;
    slider.style.setProperty("--active-ratio", ratio);

    const sliderWidth = slider.clientWidth || slider.offsetWidth;
    if (sliderWidth) {
        const chrome = getCaptionHeight(slider) + 32;
        const maxHeight = Math.min(window.innerHeight * 0.88, 820);
        const idealVisualHeight = sliderWidth / ratio;
        const visualHeight = Math.max(320, Math.min(maxHeight - chrome, idealVisualHeight));
        const totalHeight = Math.max(360, Math.min(maxHeight, visualHeight + chrome));
        slider.style.setProperty("--active-height", totalHeight + "px");
        slider.style.height = totalHeight + "px";
    }
}

function getCaptionHeight(slider) {
    const caption = slider.querySelector(".gallery-caption");
    if (!caption) return 0;
    const styles = window.getComputedStyle(caption);
    const marginBlock = parseFloat(styles.marginTop || 0) + parseFloat(styles.marginBottom || 0);
    return caption.offsetHeight + marginBlock;
}

async function resolveImages() {
    const manifest = await fetchManifest();
    const verifiedManifest = await verifyImages(manifest);
    if (verifiedManifest.length) return verifiedManifest;

    const discovered = await discoverImages();
    if (discovered.length) return discovered;

    // Fallback: keep existing demo assets if available
    const fallbackList = ["slide1.png", "slide2.png", "slide3.png"];
    return verifyImages(fallbackList);
}

async function fetchManifest() {
    try {
        const response = await fetch(GALLERY_MANIFEST_URL, { cache: "no-store" });
        if (!response.ok) return [];
        const data = await response.json();
        if (Array.isArray(data.images)) {
            return data.images;
        }
        if (Array.isArray(data)) return data;
        return [];
    } catch (error) {
        console.warn("Nie udało się pobrać manifestu galerii", error);
        return [];
    }
}

async function verifyImages(list) {
    const checked = [];
    for (const entry of list) {
        const normalized = normalizeImageEntry(entry);
        if (!normalized) continue;

        const exists = await urlExists(normalized.src);
        if (exists) {
            checked.push(normalized);
        }
    }
    return checked;
}

function normalizeImageEntry(entry) {
    if (!entry) return null;
    const file = typeof entry === "string" ? entry : entry.file || entry.src;
    if (!file) return null;

    const src = file.startsWith("http") ? file : GALLERY_FOLDER + file;
    const alt = typeof entry === "object" && entry.alt ? entry.alt : buildAltFromName(file);
    const label = typeof entry === "object" && entry.label ? entry.label : undefined;

    return { src, alt, label };
}

async function discoverImages() {
    const found = [];

    for (let i = 1; i <= DISCOVERY_LIMIT; i += 1) {
        let existing = null;
        for (const ext of SUPPORTED_EXTENSIONS) {
            const candidate = "slide" + i + "." + ext;
            const src = GALLERY_FOLDER + candidate;
            // eslint-disable-next-line no-await-in-loop
            if (await urlExists(src)) {
                existing = { src, alt: buildAltFromName(candidate) };
                break;
            }
        }
        if (existing) {
            found.push(existing);
        }
    }

    return found;
}

async function urlExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function () { resolve(true); };
        img.onerror = function () { resolve(false); };
        img.src = url + (url.includes("?") ? "&" : "?") + "_ts=" + Date.now();
    });
}

function buildAltFromName(fileName) {
    return fileName
        .replace(/[-_]/g, " ")
        .replace(/\.[^.]+$/, "")
        .replace(/^\s+|\s+$/g, "")
        .replace(/\s+/g, " ")
        .replace(/^./, function (char) { return char.toUpperCase(); }) || "Zdjęcie z realizacji";
}
