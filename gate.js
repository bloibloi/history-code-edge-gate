(function () {
  "use strict";

  const form = document.getElementById("quizForm");
  const statusEl = document.getElementById("quizStatus");
  const submitButton = document.getElementById("quizSubmit");
  const revealSection = document.getElementById("codeEdgeReveal");
  const frame = document.getElementById("codeEdgeFrame");
  const openLink = document.getElementById("openCodeEdgeLink");

  if (!window.CODE_EDGE_GATE_API) {
    statusEl.textContent = "The quiz gate is not configured yet.";
    submitButton.disabled = true;
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selected = form.querySelector('input[name="answer"]:checked');
    if (!selected) {
      statusEl.textContent = "Choose an answer first.";
      return;
    }

    submitButton.disabled = true;
    statusEl.textContent = "Checking...";

    try {
      const response = await fetch(`${window.CODE_EDGE_GATE_API}/gate/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: selected.value })
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok || !payload.redirectUrl) {
        statusEl.textContent = payload.error || "That answer isn't correct. Try again.";
        submitButton.disabled = false;
        return;
      }

      statusEl.textContent = "Correct! Opening Code Edge below.";
      form.hidden = true;
      revealSection.hidden = false;
      openLink.href = payload.redirectUrl;
      frame.src = payload.redirectUrl;
    } catch (error) {
      statusEl.textContent = "Could not reach the gate service. Check your connection and try again.";
      submitButton.disabled = false;
    }
  });
})();
