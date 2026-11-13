const nav = document.querySelector(".nav");
const toggle = document.querySelector(".menu-toggle");
const links = document.querySelector(".nav-links");
const form = document.querySelector("#inquiry-form");
const status = document.querySelector("#form-status");

window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 24);
});

toggle?.addEventListener("click", () => {
  links.classList.toggle("open");
});

links?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => links.classList.remove("open"));
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const lesson = data.get("lesson");
  const dates = String(data.get("dates") || "").trim();
  const message = String(data.get("message") || "").trim();
  const phoneInput = form.querySelector("#phone");
  const emailInput = form.querySelector("#email");
  const submitButton = form.querySelector("button[type=submit]");

  emailInput.setCustomValidity("");
  phoneInput.setCustomValidity("");
  status.classList.remove("error");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const digits = phone.replace(/\D/g, "");
  const phoneOk = digits.length >= 10 && digits.length <= 15 && !/^(\d)\1+$/.test(digits);

  if (!emailOk) {
    emailInput.setCustomValidity("Email is required.");
    emailInput.reportValidity();
    return;
  }
  if (!phoneOk) {
    phoneInput.setCustomValidity("Use a mobile number that works on the island.");
    phoneInput.reportValidity();
    status.classList.add("error");
    status.textContent = "Need a mobile number that works on the island.";
    return;
  }

  submitButton.disabled = true;
  status.textContent = "Sending your request…";

  try {
    const response = await fetch("https://formsubmit.co/ajax/f7e1cbee729db21feb7b64802c10ef50", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        lesson,
        dates: dates || "Not given",
        message: message || "None",
        _subject: `Lesson request from ${name}`,
        _replyto: email,
        _template: "table",
        _captcha: "false",
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false || result.success === "false") {
      throw new Error(result.message || "send failed");
    }
    form.reset();
    status.textContent =
      "Thank you. Hunter has your request and will email you if that time is open. This is not a booking yet.";
  } catch {
    status.classList.add("error");
    status.textContent =
      "That didn't send. Call or WhatsApp +1 (649) 246-7777 and Hunter will take the request.";
  } finally {
    submitButton.disabled = false;
  }
});

const windDirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

fetch("https://api.open-meteo.com/v1/forecast?latitude=21.7978&longitude=-72.1486&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn&temperature_unit=fahrenheit&timezone=America/Grand_Turk")
  .then((response) => response.json())
  .then((data) => {
    const current = data.current;
    if (!current) return;
    const speed = Math.round(current.wind_speed_10m);
    const gust = Math.round(current.wind_gusts_10m);
    const dir = windDirs[Math.round((((current.wind_direction_10m % 360) + 360) % 360) / 22.5) % 16];
    const temp = Math.round(current.temperature_2m);
    document.querySelectorAll("[data-wind-speed]").forEach((el) => {
      el.textContent = `${speed} kn`;
    });
    document.querySelectorAll("[data-wind-dir]").forEach((el) => {
      el.textContent = dir;
    });
    document.querySelectorAll(".live-wind").forEach((el) => {
      el.hidden = false;
    });
    const now = document.querySelector("#now-weather");
    if (!now) return;
    now.querySelector("[data-now=speed]").textContent = `${speed} kn`;
    now.querySelector("[data-now=gust]").textContent = `${gust} kn`;
    now.querySelector("[data-now=dir]").textContent = dir;
    now.querySelector("[data-now=temp]").textContent = `${temp}°F`;
    now.hidden = false;
  })
  .catch(() => {});

(function () {
  const TOPIC = "https://ntfy.sh/kiteview";
  const KEY = "ck-visit";
  if (/bot|crawl|spider|headless|preview/i.test(navigator.userAgent || "")) return;

  const path = (location.pathname || "/").replace(/\.html$/, "") || "/";
  const page = path;

  function load() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  }
  function save(state) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }
  function post(title, body, tags) {
    fetch(TOPIC, {
      method: "POST",
      keepalive: true,
      headers: {
        Title: title,
        Tags: tags,
        Click: "https://caicoskite.com" + (page === "/" ? "/" : page),
      },
      body,
    }).catch(() => {});
  }
  function duration(ms) {
    const sec = Math.max(1, Math.round(ms / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m < 1) return sec + " sec";
    return m + " min " + s + " sec";
  }

  let state = load();
  const fresh = !state;
  if (!state) {
    state = { t: Date.now(), pages: [], ref: document.referrer || "", place: "", left: false };
  }
  if (!state.pages.includes(page)) state.pages.push(page);
  try {
    sessionStorage.removeItem("ck-nav");
  } catch {}
  save(state);

  if (fresh) {
    const refLine = state.ref ? "\nFrom: " + state.ref : "";
    fetch("https://ipwho.is/")
      .then((r) => r.json())
      .then((g) => {
        if (!g || g.success === false) throw new Error("geo");
        const place = [g.city, g.region, g.country].filter(Boolean).join(", ");
        const current = load() || state;
        current.place = place;
        save(current);
        post("New visitor", place + "\n" + page + "\nPages: " + page + refLine, "globe_with_meridians");
      })
      .catch(() => {
        post("New visitor", page + "\nPages: " + page + refLine, "globe_with_meridians");
      });
  }

  function leave() {
    let nav = false;
    try {
      nav = sessionStorage.getItem("ck-nav") === "1";
    } catch {}
    if (nav) return;
    const current = load();
    if (!current || current.left) return;
    current.left = true;
    save(current);
    const where = current.place ? current.place + "\n" : "";
    const from = current.ref ? "\nFrom: " + current.ref : "";
    post(
      "Visitor left",
      where +
        page +
        "\nTime on site: " +
        duration(Date.now() - current.t) +
        "\nPages: " +
        current.pages.join(" → ") +
        from,
      "hourglass"
    );
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest("a");
    if (!link || !link.href) return;
    try {
      const next = new URL(link.href, location.href);
      if (next.origin === location.origin && link.target !== "_blank") {
        sessionStorage.setItem("ck-nav", "1");
      }
    } catch {}
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") leave();
  });
  window.addEventListener("pagehide", leave);
})();

if (window.matchMedia("(max-width: 880px)").matches) {
  const bar = document.createElement("div");
  bar.className = "sticky-contact";
  bar.innerHTML =
    '<a class="btn btn-wa" href="https://wa.me/16492467777" target="_blank" rel="noopener">WhatsApp</a>' +
    '<a class="btn btn-phone" href="tel:+16492467777">Call</a>';
  document.body.appendChild(bar);
  document.body.classList.add("has-sticky-contact");
}
