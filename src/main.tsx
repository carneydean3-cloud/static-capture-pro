import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// SPA redirect handler for Cloudflare Pages
const savedPath = sessionStorage.getItem("spa_redirect");
if (savedPath) {
  sessionStorage.removeItem("spa_redirect");
  window.history.replaceState(null, "", savedPath);
}

createRoot(document.getElementById("root")!).render(<App />);
