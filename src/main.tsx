import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import "./styles/globals.css";

// Console greeting for curious visitors
console.log("✨ thanks for stopping by! say hi: michelletheresaliu@gmail.com");

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
  