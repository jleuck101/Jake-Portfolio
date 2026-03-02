(() => {
  const root = document.documentElement;
  const CHANNEL_EASTER_EGG_ENABLED = false;

  // Alpha mode was an idea, but is intentionally removed for now.
  const CHANNEL_CLASSES = ["channel-r", "channel-g", "channel-b"];
  const ON_CLASS = "channel-on";

  function clearChannel() {
    root.classList.remove(ON_CLASS, ...CHANNEL_CLASSES);
  }

  function setChannel(letter) {
    const cls = `channel-${letter}`;
    const isAlready = root.classList.contains(cls);

    clearChannel();
    if (!isAlready) {
      root.classList.add(ON_CLASS, cls);
    }
  }

  function isTypingContext(el) {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
  }

  if (!CHANNEL_EASTER_EGG_ENABLED) {
    clearChannel();
    return;
  }

  window.addEventListener("keydown", (e) => {
    if (isTypingContext(document.activeElement)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const key = e.key.toLowerCase();

    if (key === "escape" || key === "0") {
      clearChannel();
      return;
    }

    if (key === "r" || key === "g" || key === "b") {
      setChannel(key);
    }
  });
})();
