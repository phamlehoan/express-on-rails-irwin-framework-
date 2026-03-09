(function ($) {
  "use strict"; // Start of use strict

  // Toggle the side navigation
  $("#sidebarToggle, #sidebarToggleTop").on("click", function (e) {
    $("body").toggleClass("sidebar-toggled");
    $(".sidebar").toggleClass("toggled");
    if ($(".sidebar").hasClass("toggled")) {
      $(".sidebar .collapse").collapse("hide");
    }
  });

  // Close any open menu accordions when window is resized below 768px
  $(window).resize(function () {
    if ($(window).width() < 768) {
      $(".sidebar .collapse").collapse("hide");
    }

    // Toggle the side navigation when window is resized below 480px
    if ($(window).width() < 480 && !$(".sidebar").hasClass("toggled")) {
      $("body").addClass("sidebar-toggled");
      $(".sidebar").addClass("toggled");
      $(".sidebar .collapse").collapse("hide");
    }
  });

  // Prevent the content wrapper from scrolling when the fixed side navigation hovered over
  $("body.fixed-nav .sidebar").on(
    "mousewheel DOMMouseScroll wheel",
    function (e) {
      if ($(window).width() > 768) {
        var e0 = e.originalEvent,
          delta = e0.wheelDelta || -e0.detail;
        this.scrollTop += (delta < 0 ? 1 : -1) * 30;
        e.preventDefault();
      }
    }
  );

  // Scroll to top button appear
  $(document).on("scroll", function () {
    var scrollDistance = $(this).scrollTop();
    if (scrollDistance > 100) {
      $(".scroll-to-top").fadeIn();
    } else {
      $(".scroll-to-top").fadeOut();
    }
  });

  // Smooth scroll to top
  $(document).on("click", "a.scroll-to-top", function (e) {
    e.preventDefault();
    $("html, body").stop().animate({ scrollTop: 0 }, 400, "swing");
  });

  // Clickable table row - navigate to detail on click (tr với data-href)
  $(document).on("click", ".table-row-clickable", function (e) {
    var href = $(this).data("href");
    if (href && !$(e.target).closest(".table-actions, a, button, input, select, form").length) {
      window.location.href = href;
    }
  });
  $(document).on("keydown", ".table-row-clickable", function (e) {
    if (e.key === "Enter" && $(this).data("href")) {
      window.location.href = $(this).data("href");
    }
  });
})(jQuery); // End of use strict
