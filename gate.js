(function () {
  "use strict";

  const CORRECT_ANSWER = "The Bombe";

  const form = document.getElementById("quizForm");
  const statusEl = document.getElementById("quizStatus");
  const revealSection = document.getElementById("codeEdgeReveal");
  const frame = document.getElementById("codeEdgeFrame");
  const openLink = document.getElementById("openCodeEdgeLink");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = form.querySelector('input[name="answer"]:checked');
    if (!selected) {
      statusEl.textContent = "Choose an answer first.";
      return;
    }

    if (selected.value !== CORRECT_ANSWER) {
      statusEl.textContent = "That answer isn't correct. Try again.";
      return;
    }

    statusEl.textContent = "Correct! Opening Code Edge below.";
    form.hidden = true;
    revealSection.hidden = false;
    openLink.href = window.CODE_EDGE_URL;
    frame.src = window.CODE_EDGE_URL;
  });
})();
