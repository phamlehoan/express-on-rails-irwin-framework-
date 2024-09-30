window.addEventListener("DOMContentLoaded", (event) => {
  $(".notification .alert .close").on("click", () => {
    $(".notification .alert").alert("close");
  });

  let notificationProgressCtx = 100;
  const notificationProgressId = window.setInterval(() => {
    notificationProgressCtx--;
    $(".notification .alert .progress-bar").attr(
      "style",
      "width: " + notificationProgressCtx + "%"
    );

    if (notificationProgressCtx === 0) {
      clearInterval(notificationProgressId);
      $(".notification .alert").alert("close");
    }
  }, 100);
});
