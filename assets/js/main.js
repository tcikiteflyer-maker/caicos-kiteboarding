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
