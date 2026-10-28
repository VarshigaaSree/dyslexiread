document.addEventListener("DOMContentLoaded", () => {
  const userIdInput = document.getElementById("userId");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const statusMsg = document.getElementById("statusMsg");

  const lineInput = document.getElementById("lineSpacing");
  const trackInput = document.getElementById("letterSpacing");
  const lineVal = document.getElementById("lineVal");
  const trackVal = document.getElementById("trackVal");
  const previewCard = document.getElementById("previewCard");
  const previewPairs = document.getElementById("previewPairs");
  const previewText = document.getElementById("previewText");
  const saveBtn = document.getElementById("saveCloudBtn");
  const tintBtns = document.querySelectorAll(".tint-btn");

  let sessionUser = {
    userId: "",
    password: "",
    lineHeight: 1.8,
    letterSpacing: 0.12,
    tintColor: "#fbf0d9"
  };

  function showMessage(text, isError = true) {
    if (!statusMsg) return;
    statusMsg.textContent = text;
    statusMsg.className = isError ? "msg-error" : "msg-success";
    statusMsg.style.display = "block";
  }

  function updateVisuals() {
    if (lineInput) lineInput.value = sessionUser.lineHeight;
    if (trackInput) trackInput.value = sessionUser.letterSpacing;
    if (lineVal) lineVal.textContent = sessionUser.lineHeight + "x";
    if (trackVal) trackVal.textContent = sessionUser.letterSpacing + "em";

    if (previewCard) previewCard.style.backgroundColor = sessionUser.tintColor;
    if (previewPairs) previewPairs.style.letterSpacing = sessionUser.letterSpacing + "em";
    if (previewText) {
      previewText.style.lineHeight = sessionUser.lineHeight;
      previewText.style.letterSpacing = sessionUser.letterSpacing + "em";
    }
  }

  function applyToTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "APPLY_SETTINGS",
          settings: sessionUser
        }, () => {
          if (chrome.runtime.lastError) {
            // Ignored when tab was not refreshed
          }
        });
      }
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", () => {
      const userId = userIdInput?.value.trim();
      const password = passwordInput?.value.trim();

      if (!userId || !password) {
        return showMessage("Please enter both User ID and Password.", true);
      }

      fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password })
      })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          showMessage(data.message, true);
        } else {
          sessionUser.userId = userId;
          sessionUser.password = password;
          showMessage("Account registered successfully! Now logged in.", false);
        }
      })
      .catch(() => showMessage("Server offline. Start backend server.", true));
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const userId = userIdInput?.value.trim();
      const password = passwordInput?.value.trim();

      if (!userId || !password) {
        return showMessage("Please enter User ID and Password.", true);
      }

      fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password })
      })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          showMessage(data.message, true);
        } else {
          sessionUser = { ...data.profile, password };
          updateVisuals();
          applyToTab();
          showMessage(`Welcome back, ${userId}! Profile synced.`, false);
        }
      })
      .catch(() => showMessage("Server offline. Start backend server.", true));
    });
  }

  if (lineInput) {
    lineInput.addEventListener("input", (e) => {
      sessionUser.lineHeight = parseFloat(e.target.value);
      if (lineVal) lineVal.textContent = sessionUser.lineHeight + "x";
      if (previewText) previewText.style.lineHeight = sessionUser.lineHeight;
      applyToTab();
    });
  }

  if (trackInput) {
    trackInput.addEventListener("input", (e) => {
      sessionUser.letterSpacing = parseFloat(e.target.value);
      if (trackVal) trackVal.textContent = sessionUser.letterSpacing + "em";
      if (previewPairs) previewPairs.style.letterSpacing = sessionUser.letterSpacing + "em";
      if (previewText) previewText.style.letterSpacing = sessionUser.letterSpacing + "em";
      applyToTab();
    });
  }

  tintBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sessionUser.tintColor = btn.getAttribute("data-color");
      if (previewCard) previewCard.style.backgroundColor = sessionUser.tintColor;
      applyToTab();
    });
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!sessionUser.userId || !sessionUser.password) {
        return showMessage("Please register or log in first to save.", true);
      }

      saveBtn.textContent = "Syncing...";
      fetch("http://localhost:5000/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionUser)
      })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          saveBtn.textContent = "Saved to Cloud!";
          showMessage("Customization permanently saved to database.", false);
        } else {
          showMessage(data.message, true);
          saveBtn.textContent = "Save & Sync to Cloud";
        }
        setTimeout(() => saveBtn.textContent = "Save & Sync to Cloud", 1500);
      })
      .catch(() => {
        showMessage("Connection failed. Check backend server.", true);
        saveBtn.textContent = "Save & Sync to Cloud";
      });
    });
  }
});