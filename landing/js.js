  (function () {
            "use strict";

            /* ==========================================================
               ⚙️  CONFIG — EDIT ONLY THESE THREE LINES
               ========================================================== */

            // Google Apps Script Web App URL
            const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzhaGC8K-UV5qqAOdjJ5AFnDlKIRU7uCXPL6qLFiuuWWdokTZKHQOY2DncOreVpra2foA/exec";

            // WhatsApp number — country code + number, digits only (no +, no spaces)
            // India: 91 + 10-digit number
            const WHATSAPP_NUMBER = "917830085280";

            // Direct call number — international format with + (used for tel: link)
            const CALL_NUMBER = "+917830085280";

            /* ==========================================================
               WhatsApp pre-fill message (stays hidden — only used in URL)
               ========================================================== */
            const WA_MESSAGE = "Hii sir I want to discuss for Meta Ad";

            function waLink() {
                return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WA_MESSAGE);
            }

            document.querySelectorAll("[data-wa]").forEach(function (el) {
                el.setAttribute("href", waLink());
            });

            document.querySelectorAll("[data-call]").forEach(function (el) {
                el.setAttribute("href", "tel:" + CALL_NUMBER);
            });

            /* ==========================================================
               Footer year
               ========================================================== */
            document.querySelectorAll("[data-year]").forEach(function (el) {
                el.textContent = new Date().getFullYear();
            });

            /* ==========================================================
               Helpers
               ========================================================== */
            function isConfigured(url) {
                return url && url.indexOf("PASTE_YOUR") === -1 && url.indexOf("http") === 0;
            }

            function two(n) { return n < 10 ? "0" + n : "" + n; }

            /* ==========================================================
               Modal control
               ========================================================== */
            const modal = document.querySelector("[data-modal]");
            const modalCard = modal ? modal.querySelector(".modal__card") : null;

            function openModal() {
                if (!modal) return;
                if (modalCard) {
                    modalCard.style.animation = "none";
                    void modalCard.offsetWidth;
                    modalCard.style.animation = "";
                }
                modal.classList.add("open");
                modal.setAttribute("aria-hidden", "false");
                document.body.style.overflow = "hidden";
            }

            function closeModal() {
                if (!modal) return;
                modal.classList.remove("open");
                modal.setAttribute("aria-hidden", "true");
                document.body.style.overflow = "";
            }

            document.querySelectorAll("[data-modal-close]").forEach(function (el) {
                el.addEventListener("click", closeModal);
            });

            document.addEventListener("keydown", function (e) {
                if (e.key === "Escape" && modal && modal.classList.contains("open")) closeModal();
            });

            /* ==========================================================
               Phone input — digits only, exactly 10 chars
               ========================================================== */
            document.querySelectorAll('input[name="phone"]').forEach(function (input) {
                input.addEventListener("input", function () {
                    input.value = input.value.replace(/\D/g, "").slice(0, 10);
                });
                input.addEventListener("keypress", function (e) {
                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                });
                input.addEventListener("paste", function (e) {
                    e.preventDefault();
                    const pasted = (e.clipboardData || window.clipboardData).getData("text");
                    input.value = pasted.replace(/\D/g, "").slice(0, 10);
                });
            });

            /* ==========================================================
               Form handling
               ========================================================== */
            document.querySelectorAll("[data-lead-form]").forEach(function (form) {

                const nameInput = form.querySelector('input[name="name"]');
                const phoneInput = form.querySelector('input[name="phone"]');
                const segmentInput = form.querySelector('select[name="segment"]');
                const button = form.querySelector('button[type="submit"]');
                const statusEl = form.querySelector("[data-status]");
                const errName = form.querySelector('[data-error="name"]');
                const errPhone = form.querySelector('[data-error="phone"]');
                const errSegment = form.querySelector('[data-error="segment"]');

                let sending = false;

                function clearErrors() {
                    errName.textContent = "";
                    errPhone.textContent = "";
                    errSegment.textContent = "";
                    nameInput.classList.remove("invalid");
                    phoneInput.classList.remove("invalid");
                    segmentInput.classList.remove("invalid");
                    statusEl.textContent = "";
                    statusEl.className = "form__status";
                }

                function setStatus(msg, type) {
                    statusEl.textContent = msg;
                    statusEl.className = "form__status" + (type ? " " + type : "");
                }

                function validate() {
                    clearErrors();
                    let ok = true;

                    const name = nameInput.value.trim().replace(/\s+/g, " ");
                    if (name.length < 2 || !/[A-Za-z\u00C0-\u024F\u0900-\u097F]/.test(name)) {
                        errName.textContent = "Please enter your full name.";
                        nameInput.classList.add("invalid");
                        ok = false;
                    }

                    const phone = phoneInput.value.replace(/\D/g, "");
                    if (phone.length !== 10) {
                        errPhone.textContent = "Please enter a valid 10-digit mobile number.";
                        phoneInput.classList.add("invalid");
                        ok = false;
                    } else if (!/^[6-9]\d{9}$/.test(phone)) {
                        errPhone.textContent = "Number must start with 6, 7, 8 or 9.";
                        phoneInput.classList.add("invalid");
                        ok = false;
                    }

                    const segment = segmentInput.value;
                    if (!segment) {
                        errSegment.textContent = "Please select your segment.";
                        segmentInput.classList.add("invalid");
                        ok = false;
                    }

                    return ok ? { name: name, phone: phone, segment: segment } : null;
                }

                form.addEventListener("submit", async function (e) {
                    e.preventDefault();
                    if (sending) return;

                    const data = validate();
                    if (!data) {
                        const firstBad = form.querySelector(".invalid");
                        if (firstBad) firstBad.focus();
                        return;
                    }

                    sending = true;
                    button.disabled = true;
                    button.textContent = "Submitting...";
                    setStatus("Submitting...", "loading");

                    const now = new Date();
                    const date = two(now.getDate()) + "/" + two(now.getMonth() + 1) + "/" + now.getFullYear();
                    const time = two(now.getHours()) + ":" + two(now.getMinutes()) + ":" + two(now.getSeconds());

                    // ❌ source field हटा दिया गया है
                    const payload = {
                        name: data.name,
                        phone: data.phone,
                        segment: data.segment,
                        date: date,
                        time: time,
                        page: window.location.href
                    };

                    try {
                        if (isConfigured(GOOGLE_SCRIPT_URL)) {
                            const body = new URLSearchParams();
                            Object.keys(payload).forEach(function (k) { body.append(k, payload[k]); });

                            // ✅ CORS fix: no-cors mode use करो
                            await fetch(GOOGLE_SCRIPT_URL, {
                                method: "POST",
                                mode: "no-cors",
                                body: body
                            });
                            // no-cors mode में response opaque होता है, इसलिए res.ok check नहीं कर सकते
                            // fetch resolve हो गया = request successfully भेज दी गई
                        } else {
                            console.warn("[Lead Form] GOOGLE_SCRIPT_URL not configured. Lead data:", payload);
                            await new Promise(function (r) { setTimeout(r, 600); });
                        }

                        /* ---------- SUCCESS ---------- */
                        form.reset();
                        setStatus("");
                        openModal();

                    } catch (err) {
                        console.error("[Lead Form] Submit failed:", err);
                        setStatus("Something went wrong. Please try again or contact us on WhatsApp.", "error");
                    } finally {
                        sending = false;
                        button.disabled = false;
                        button.textContent = "Get Started";
                    }
                });

                [nameInput, phoneInput, segmentInput].forEach(function (el) {
                    const evt = el.tagName === "SELECT" ? "change" : "input";
                    el.addEventListener(evt, function () {
                        el.classList.remove("invalid");
                        const key = el === nameInput ? "name" : el === phoneInput ? "phone" : "segment";
                        const box = form.querySelector('[data-error="' + key + '"]');
                        if (box) box.textContent = "";
                    });
                });
            });

        })();