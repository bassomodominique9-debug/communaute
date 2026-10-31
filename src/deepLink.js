import "./deepLink.css";

// Fait défiler jusqu'à l'élément désigné par une notification (ex. « publication:ID »).
// La page peut mettre un peu de temps à charger ses données : on réessaie pendant quelques secondes.
export function focusTarget(key, tries = 40) {
  let n = 0;
  const timer = setInterval(() => {
    n += 1;
    const el = document.querySelector(`[data-focus="${CSS.escape(key)}"]`);
    if (el) {
      clearInterval(timer);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("focus-flash");
      setTimeout(() => el.classList.remove("focus-flash"), 2500);
    } else if (n >= tries) {
      clearInterval(timer);
    }
  }, 150);
}
