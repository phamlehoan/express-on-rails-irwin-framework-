window.addEventListener("DOMContentLoaded", (event) => {
  // Collapse responsive navbar when toggler is visible
  const navbarToggler = document.body.querySelector(".navbar-toggler");
  const responsiveNavItems = [].slice.call(
    document.querySelectorAll("#navbarResponsive .nav-link")
  );
  responsiveNavItems.map(function (responsiveNavItem) {
    responsiveNavItem.addEventListener("click", () => {
      if (window.getComputedStyle(navbarToggler).display !== "none") {
        navbarToggler.click();
      }
    });
  });

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
