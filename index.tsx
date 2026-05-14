import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to (#root)");
}

window.addEventListener("error", (e) => {
  const msg = e.message || "unknown";

  if (msg.includes("ResizeObserver loop completed with undelivered notifications")) {
    console.warn("IGNORED_WINDOW_WARNING:", msg);
    return;
  }

  console.error("WINDOW_ERROR_FULL", {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error,
    stack: (e.error as any)?.stack,
  });
});

window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
  console.error("UNHANDLED_REJECTION_FULL", {
    reason: e.reason,
    stack: (e.reason as any)?.stack,
    message: (e.reason as any)?.message,
  });
});

console.log("BOOT_OK:", new Date().toISOString());

createRoot(rootElement).render(<App />);