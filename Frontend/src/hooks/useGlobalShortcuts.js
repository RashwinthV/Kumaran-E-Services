import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import defaultShortcuts from "../config/shortcuts.json";

// Export this hook so UI components (like ShortcutGuide) can display them!
export const useShortcutList = () => {
  // Load overrides from localStorage
  const [overrides, setOverrides] = useState(() => {
    const saved = localStorage.getItem("app_shortcuts_overrides");
    try {
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Merge JSON defaults with LocalStorage overrides
  const shortcuts = useMemo(() => {
    const specificOverrides = overrides.updates || {};

    const mergedDefaults = defaultShortcuts.map((def) => {
      if (specificOverrides[def.id]) {
        return { ...def, ...specificOverrides[def.id] };
      }
      return def;
    });

    const customShortcuts = (overrides.custom || []).map((s) => ({
      ...s,
      isCustom: true,
    }));

    return [...mergedDefaults, ...customShortcuts];
  }, [overrides]);

  // Listen for storage/custom updates
  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem("app_shortcuts_overrides");
      if (saved) {
        try {
          setOverrides(JSON.parse(saved));
        } catch {}
      } else {
        setOverrides({});
      }
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("shortcutsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("shortcutsUpdated", handleUpdate);
    };
  }, []);

  return shortcuts;
};

const useGlobalShortcuts = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const shortcuts = useShortcutList();

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName,
      );

      for (const shortcut of shortcuts) {
        if (!shortcut.key) continue;

        const keyMatch =
          shortcut.key.length === 1
            ? shortcut.key.toLowerCase() === e.key.toLowerCase()
            : shortcut.key.toLowerCase() === e.key.toLowerCase();
        // Normalized comparison

        const matchAlt = !!shortcut.altKey === e.altKey;
        const matchCtrl = !!shortcut.ctrlKey === e.ctrlKey;
        const matchShift = !!shortcut.shiftKey === e.shiftKey;
        const matchMeta = !!shortcut.metaKey === e.metaKey;

        if (keyMatch && matchAlt && matchCtrl && matchShift && matchMeta) {
          // Safety: If no modifiers and in input, skip (unless F-key or special)
          if (
            !shortcut.altKey &&
            !shortcut.ctrlKey &&
            !shortcut.metaKey &&
            isInput &&
            shortcut.key.length === 1
          ) {
            continue;
          }

          e.preventDefault();

          if (shortcut.action === "navigate") {
            navigate(shortcut.target);
          } else if (shortcut.action === "logout") {
            logout();
          }
          return;
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [navigate, logout, shortcuts]);
};

export default useGlobalShortcuts;
