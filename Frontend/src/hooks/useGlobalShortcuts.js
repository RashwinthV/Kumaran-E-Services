import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const useGlobalShortcuts = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Global keys should only work if we are NOT inside a modal or specific input that needs them?
      // For these specific modifier keys (Alt+S, Alt+L), it's usually safe to override.

      // Alt+S: Settings
      if (e.altKey && e.key === "a") {
        e.preventDefault();
        navigate("/settings");
      }

      // Alt+L: Logout
      if (e.altKey && e.key === "l") {
        e.preventDefault();
        logout();
      }
      if (e.altKey && e.key === "c") {
        e.preventDefault();
        navigate("/customers");
      }
          if (e.altKey && e.key === "s") {
        e.preventDefault();
        navigate("/sale-history");
      }

      // Ctrl+F: Product Catalog (Global Navigate)
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        navigate("/product-catalog");
      }

      // F11: Navigate to Reports (assuming this is global)
      if (e.key === "F11") {
        e.preventDefault();
        navigate("/reports");
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [navigate, logout]);
};

export default useGlobalShortcuts;
