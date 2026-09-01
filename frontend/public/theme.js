// Apply the saved or system-preferred theme before the app renders to avoid a
// flash of the wrong theme. Kept external so it stays compatible with the
// Content-Security-Policy `script-src 'self'` (no inline scripts allowed).
;(function () {
  try {
    var stored = localStorage.getItem("tala-theme")
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches
    if (dark) document.documentElement.classList.add("dark")
  } catch (e) {}
})()
