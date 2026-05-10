/* Mobile shared chrome — top nav + drawer + footer.
   Vanilla JS (no React), inlines on every page. */
(function () {
  function init() {
    /* drawer */
    const drawer = document.getElementById("m-drawer");
    if (drawer) {
      document.querySelectorAll("[data-drawer-open]").forEach((b) => b.addEventListener("click", () => {
        drawer.classList.add("in");
        document.body.style.overflow = "hidden";
      }));
      drawer.querySelectorAll("[data-drawer-close]").forEach((b) => b.addEventListener("click", close));
      drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
      function close() { drawer.classList.remove("in"); document.body.style.overflow = ""; }
    }
    /* faq */
    document.querySelectorAll(".m-faq__item").forEach((item) => {
      const q = item.querySelector(".m-faq__q");
      if (q) q.addEventListener("click", () => item.classList.toggle("open"));
    });
    /* reveal on scroll */
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });
      document.querySelectorAll(".m-reveal").forEach((el) => io.observe(el));
    } else {
      document.querySelectorAll(".m-reveal").forEach((el) => el.classList.add("in"));
    }
    /* lucide icons */
    if (window.lucide) window.lucide.createIcons();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
