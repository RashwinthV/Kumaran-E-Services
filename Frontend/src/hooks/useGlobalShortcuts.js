import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import defaultShortcuts from "../config/shortcuts.json";

const useGlobalShortcuts = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
    // Create a map of defaults for easy access
    // If the structure of defaults changes (new IDs), they appear automatically.
    // If user removed an ID in overrides, we need to respect that?
    // For simplicity: We take defaults, and map over them applying overrides.
    // Plus check if there are any *custom* shortcuts added in overrides.

    const specificOverrides = overrides.updates || {};
    // overrides.updates is a map: { "nav_settings": { key: "b", ... } }

    // 1. Map over defaults and apply overrides
    const mergedDefaults = defaultShortcuts.map((def) => {
      if (specificOverrides[def.id]) {
        return { ...def, ...specificOverrides[def.id] };
      }
      return def;
    });

    // 2. Add purely custom shortcuts (ids that don't exist in defaults)
    const customShortcuts = (overrides.custom || []).map((s) => ({
      ...s,
      isCustom: true,
    }));

    // 3. Filter out deleted shortcuts (if we implement delete)
    // const activeShortcuts = mergedDefaults.filter(s => !overrides.deleted?.includes(s.id));

    // For now, let's just combine
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

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName
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
