/**
 * Flash notification countdown + auto-dismiss (Bootstrap 5, no jQuery).
 * Requires bootstrap.bundle loaded before this script.
 */
window.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".notification");
  if (!root) return;

  const alerts = root.querySelectorAll(".alert");
  if (!alerts.length) return;

  const progressBars = root.querySelectorAll(".alert .progress-bar");
  if (!progressBars.length) return;

  progressBars.forEach((el) => {
    el.style.width = "100%";
  });

  let pct = 100;
  const tickMs = 100;
  const id = window.setInterval(() => {
    pct -= 1;
    progressBars.forEach((el) => {
      el.style.width = pct + "%";
    });
    if (pct <= 0) {
      window.clearInterval(id);
      alerts.forEach((alertEl) => {
        if (window.bootstrap && window.bootstrap.Alert) {
          try {
            window.bootstrap.Alert.getOrCreateInstance(alertEl).close();
          } catch {
            alertEl.remove();
          }
        } else {
          alertEl.remove();
        }
      });
    }
  }, tickMs);
});
