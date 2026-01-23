import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Could not find root element to mount to (#root)');
}

// DEBUG: catch silent crashes in production
window.addEventListener("error", (e) => {
  const msg = (e as any)?.message || "unknown";
  const err = (e as any)?.error;
  console.error("WINDOW_ERROR:", msg, err);
  alert("WINDOW_ERROR: " + msg);
});

window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
  const reason: any = (e as any)?.reason;
  console.error("UNHANDLED_REJECTION:", reason);

  let txt = "";
  try {
    if (typeof reason === "string") txt = reason;
    else if (reason?.message) txt = reason.message;
    else txt = JSON.stringify(reason);
  } catch {
    txt = "non-serializable reason";
  }

  alert("UNHANDLED_REJECTION: " + txt);
});

console.log("BOOT_OK:", new Date().toISOString());

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
