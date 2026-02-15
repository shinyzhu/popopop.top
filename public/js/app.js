// ── DOM references ──
const popText = document.getElementById("popText");
const fontSelect = document.getElementById("fontSelect");
const fontSize = document.getElementById("fontSize");
const fontSizeValue = document.getElementById("fontSizeValue");
const textColor = document.getElementById("textColor");
const bgColor = document.getElementById("bgColor");
const shadowToggle = document.getElementById("shadowToggle");
const strokeToggle = document.getElementById("strokeToggle");
const copyBtn = document.getElementById("copyBtn");
const copyToast = document.getElementById("copyToast");
const preview = document.getElementById("preview");
const popDisplay = document.getElementById("popDisplay");

// ── Update helpers ──
function updateText() {
  const raw = popText.value || "POP";
  popDisplay.innerHTML = raw
    .split("\n")
    .map((line) => line || "&nbsp;")
    .join("<br>");
}

function updateFont() {
  popDisplay.style.fontFamily = fontSelect.value;
}

function updateSize() {
  const size = fontSize.value;
  fontSizeValue.textContent = size;
  popDisplay.style.fontSize = size + "px";
}

function updateTextColor() {
  popDisplay.style.color = textColor.value;
}

function updateBgColor() {
  preview.style.backgroundColor = bgColor.value;
}

function updateShadow() {
  popDisplay.style.textShadow = shadowToggle.checked
    ? "4px 4px 0 #222, 8px 8px 0 rgba(0,0,0,0.15)"
    : "none";
}

function updateStroke() {
  popDisplay.classList.toggle("stroke", strokeToggle.checked);
}

// ── Event listeners ──
popText.addEventListener("input", updateText);
fontSelect.addEventListener("change", updateFont);
fontSize.addEventListener("input", updateSize);
textColor.addEventListener("input", updateTextColor);
bgColor.addEventListener("input", updateBgColor);
shadowToggle.addEventListener("change", updateShadow);
strokeToggle.addEventListener("change", updateStroke);

// ── Copy as Image ──
copyBtn.addEventListener("click", async () => {
  try {
    copyBtn.disabled = true;
    copyBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Capturing…';

    const canvas = await html2canvas(preview, {
      backgroundColor: null,
      scale: 2, // retina-quality
      useCORS: true,
    });

    canvas.toBlob(async (blob) => {
      if (!blob) {
        throw new Error("Failed to create image blob");
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        showToast();
      } catch (clipErr) {
        // Fallback: download the image if clipboard API is unavailable
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pop-text.png";
        a.click();
        URL.revokeObjectURL(url);
        showToast("Image downloaded!");
      } finally {
        resetCopyBtn();
      }
    }, "image/png");
  } catch (err) {
    console.error("Copy failed:", err);
    resetCopyBtn();
  }
});

function resetCopyBtn() {
  copyBtn.disabled = false;
  copyBtn.innerHTML =
    '<i class="bi bi-clipboard-check"></i> Copy as Image';
}

function showToast(message) {
  copyToast.textContent = message || "Copied to clipboard!";
  copyToast.classList.remove("d-none");
  setTimeout(() => copyToast.classList.add("d-none"), 2000);
}
