const BASE_URL = "http://localhost:3000";

export const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
};

export const copyReport = (id: string) => {
  navigator.clipboard.writeText(`${BASE_URL}/reports/${id}`);
};

export const copyReview = (id: string) => {
  navigator.clipboard.writeText(`${BASE_URL}/reviews/${id}`);
};

export const copyFeedback = (id: string) => {
  navigator.clipboard.writeText(`${BASE_URL}/feedback/${id}`);
};
