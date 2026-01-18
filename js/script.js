// Открытие конверта
const envelope = document.getElementById("envelope");
const openBtn = document.getElementById("openEnvelope");

function openEnvelope() {
  envelope.classList.add("open");

  // Скрываем кнопку-печать
  document.getElementById("openEnvelope").style.display = "none";

  setTimeout(() => {
    document.getElementById("envelopeScreen").style.display = "none";
    document.getElementById("mainContent").classList.add("active");
    observeSections();
    updateTimeline();
    window.addEventListener("scroll", updateTimeline);
  }, 1200);
}

envelope.addEventListener("click", openEnvelope);
openBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  openEnvelope();
});

// Появление блоков
function observeSections() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("appear");
        }
      });
    },
    { threshold: 0.1 },
  );

  document.querySelectorAll(".fade-in").forEach((section) => {
    observer.observe(section);
  });
}

// Музыка
const music = document.getElementById("weddingMusic");
document.getElementById("musicBtn").addEventListener("click", () => {
  if (music.paused) {
    music.play().catch((e) => console.log("Autoplay blocked"));
    document.getElementById("musicBtn").textContent = "Пауза";
  } else {
    music.pause();
    document.getElementById("musicBtn").textContent = "Включить музыку";
  }
});

// Таймлайн
function updateTimeline() {
  const timeline = document.getElementById("timelineSection");
  const heart = document.getElementById("heart");
  const events = document.querySelectorAll(".timeline__event");

  if (!timeline || !heart) return;

  const timelineRect = timeline.getBoundingClientRect();
  const scrollTop = window.scrollY;
  const timelineTop = timeline.offsetTop;
  const timelineHeight = timeline.offsetHeight;

  let progress =
    (scrollTop + window.innerHeight / 2 - timelineTop) / timelineHeight;
  progress = Math.max(0, Math.min(1, progress));
  heart.style.top = `${progress * timelineHeight}px`;

  events.forEach((event, index) => {
    const eventOffset = (index + 1) * (timelineHeight / (events.length + 1));
    if (progress * timelineHeight > eventOffset - 100) {
      event.classList.add("visible");
    }
  });
}

// Переключение режима блюд при выборе "+1"
document
  .getElementById("plusOneToggle")
  .addEventListener("change", function () {
    const fields = document.getElementById("plusOneFields");
    const single = document.getElementById("dishesSingle");
    const double = document.getElementById("dishesDouble");

    if (this.checked) {
      fields.style.display = "block";
      single.style.display = "none";
      double.style.display = "block";
    } else {
      fields.style.display = "none";
      single.style.display = "block";
      double.style.display = "none";
    }
  });

/// === ОТПРАВКА В TELEGRAM ===
document
  .getElementById("rsvpForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    // --- Сбор данных (без изменений) ---
    const firstName =
      this.querySelector('input[name="firstName"]')?.value.trim() || "";
    const lastName =
      this.querySelector('input[name="lastName"]')?.value.trim() || "";

    let plusOneInfo = "";
    const plusOneChecked = this.querySelector('input[name="plusOne"]').checked;
    if (plusOneChecked) {
      const plusOneName = this.querySelector(
        'input[name="plusOneName"]',
      )?.value.trim();
      plusOneInfo = plusOneName ? ` (с ${plusOneName})` : " (с гостем)";
    }

    const fullName =
      firstName && lastName
        ? `${firstName} ${lastName}${plusOneInfo}`
        : firstName || lastName || "Не указано";

    let attendance = "Не выбрано";
    const attendanceEl = this.querySelector('input[name="attendance"]:checked');
    if (attendanceEl) {
      attendance = attendanceEl.value === "yes" ? "Да" : "Нет";
    }

    const drinkEls = this.querySelectorAll('input[name="drinks"]:checked');
    const drinks = drinkEls.length
      ? Array.from(drinkEls)
          .map((el) => {
            const map = {
              wine: "Вино",
              whiskey: "Виски",
              champagne: "Шампанское",
              cocktail: "Коктейли",
              "non-alco": "Безалкогольные",
            };
            return map[el.value] || el.value;
          })
          .join(", ")
      : "Не выбрано";

    let dishResult = "Не выбрано";
    if (plusOneChecked) {
      const dishEls = this.querySelectorAll('input[name="dishDouble"]:checked');
      if (dishEls.length > 0) {
        const dishMap = {
          fish: "Рыба",
          chicken: "Курица",
          vegan: "Вегетарианское",
          beef: "Говядина",
        };
        const dishes = Array.from(dishEls).map(
          (el) => dishMap[el.value] || el.value,
        );
        dishResult = dishes.join(", ");
      }
    } else {
      const dishEl = this.querySelector('input[name="dish"]:checked');
      if (dishEl) {
        const dishMap = {
          fish: "Рыба",
          chicken: "Курица",
          vegan: "Вегетарианское",
          beef: "Говядина",
        };
        dishResult = dishMap[dishEl.value] || dishEl.value;
      }
    }

    // === ФОРМИРУЕМ СООБЩЕНИЕ ===
    const message = `
🎉 Новая анкета!

Имя и фамилия: ${fullName}
Присутствие: ${attendance}
Напитки: ${drinks}
Горячее блюдо(а): ${dishResult}
  `.trim();

    // === НАСТРОЙКИ TELEGRAM ===
    const TELEGRAM_BOT_TOKEN = "8584764584:AAFrJ9Qz3nr_AgT1bCBatZw8DUmscjzOBCg";
    const TELEGRAM_CHAT_ID = "5234629479";

    // === ОТПРАВКА ===
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "HTML",
          }),
        },
      );

      if (response.ok) {
        // УСПЕХ → показываем попап
        showThankYouModal(firstName, attendance === "Да");
      } else {
        alert("Ошибка отправки. Попробуйте позже.");
        console.error("Telegram error:", await response.text());
      }
    } catch (err) {
      alert("Не удалось отправить данные. Проверьте интернет.");
      console.error("Fetch error:", err);
    }
  });

// === ПОПАП ===
function showThankYouModal(firstName, isAttending) {
  const modal = document.getElementById("thankYouModal");
  const modalText = document.getElementById("modalText");

  if (isAttending) {
    modalText.innerHTML = `
      Спасибо, ${firstName || "дорогой гость"}! 💌<br>
      Мы очень рады, что вы разделите с нами этот особенный день.<br>
      До встречи 14 февраля!
    `;
  } else {
    modalText.innerHTML = `
      Спасибо, ${firstName || "дорогой гость"}, за ваш ответ. 💛<br>
      Нам будет вас не хватать, но мы обязательно найдём повод снова собраться вместе!
    `;
  }

  modal.style.display = "flex";
}

// Закрытие модального окна
document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("thankYouModal").style.display = "none";
});

document.getElementById("modalOverlay").addEventListener("click", () => {
  document.getElementById("thankYouModal").style.display = "none";
});
