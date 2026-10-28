(function () {
  function getStyleElement() {
    let style = document.getElementById("dyslexiread-engine");
    if (!style) {
      style = document.createElement("style");
      style.id = "dyslexiread-engine";
      const target = document.head || document.documentElement || document.body;
      if (target) {
        target.appendChild(style);
      }
    }
    return style;
  }

  function applyStyles(lineHeight, letterSpacing, tintColor) {
    const style = getStyleElement();
    if (!style) return;

    style.textContent = `
      html, body, div, p, span, a, h1, h2, h3, h4, h5, h6, li, td, th {
        line-height: ${lineHeight} !important;
        letter-spacing: ${letterSpacing}em !important;
        font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif !important;
      }
      body, #content, .mw-body, #content.mw-body {
        background-color: ${tintColor} !important;
      }
    `;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "APPLY_SETTINGS") {
      const { lineHeight, letterSpacing, tintColor } = request.settings;
      applyStyles(lineHeight, letterSpacing, tintColor);
      sendResponse({ status: "success" });
    }
    return true;
  });
})();