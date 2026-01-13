import React, { useState, useEffect } from "react";
import defaultShortcuts from "../../config/shortcuts.json";
import { toast } from "react-toastify";

const ShortcutsSettings = () => {
  const [shortcuts, setShortcuts] = useState([]);

  // Load and merge on mount
  useEffect(() => {
    loadShortcuts();
  }, []);

  const loadShortcuts = () => {
    const saved = localStorage.getItem("app_shortcuts_overrides");
    let overrides = {};
    if (saved) {
      try {
        overrides = JSON.parse(saved);
      } catch (e) {
        overrides = {};
      }
    }

    const specificOverrides = overrides.updates || {};

    // Merge defaults
    const merged = defaultShortcuts.map((def) => {
      if (specificOverrides[def.id]) {
        return { ...def, ...specificOverrides[def.id] };
      }
      return def;
    });

    // Add custom
    const custom = (overrides.custom || []).map((s) => ({
      ...s,
      isCustom: true,
    }));

    setShortcuts([...merged, ...custom]);
  };

  const handleSave = () => {
    // Calculate Diff
    const updates = {};
    const custom = [];

    shortcuts.forEach((s) => {
      if (s.isCustom) {
        custom.push(s);
      } else {
        // Check if different from default
        const original = defaultShortcuts.find((d) => d.id === s.id);
        if (original) {
          // If any relevant field changed
          if (
            original.key !== s.key ||
            original.altKey !== s.altKey ||
            original.ctrlKey !== s.ctrlKey ||
            original.description !== s.description ||
            original.target !== s.target
          ) {
            updates[s.id] = s;
          }
        }
      }
    });

    const overrides = { updates, custom };
    localStorage.setItem("app_shortcuts_overrides", JSON.stringify(overrides));

    // Dispatch event
    window.dispatchEvent(new Event("shortcutsUpdated"));
    toast.success("Shortcuts updated successfully!");
  };

  const handleReset = () => {
    if (
      window.confirm("Are you sure you want to reset all shortcuts to default?")
    ) {
      localStorage.removeItem("app_shortcuts_overrides");
      loadShortcuts(); // Reload defaults
      window.dispatchEvent(new Event("shortcutsUpdated"));
      toast.info("Restored default shortcuts");
    }
  };

  const updateShortcut = (id, field, value) => {
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addShortcut = () => {
    const newId = `custom_${Date.now()}`;
    setShortcuts([
      ...shortcuts,
      {
        id: newId,
        description: "New Shortcut",
        key: "",
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        action: "navigate", // Default to navigate
        target: "/",
        isCustom: true,
      },
    ]);
  };

  const deleteShortcut = (id) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
    // Note: For standard shortcuts, filtering them out here effectively "deletes" them from UI
    // But our Save logic above only tracks Updates.
    // To properly delete a standard shortcut, we'd need a 'deleted' array in overrides.
    // For now, simpler to just allow deleting custom ones, or 'reset' standard ones.
    // Implementation detail: If s.isCustom is false, maybe show a "Reset" icon instead of trash?
    // Or just ignore it? Let's assume user only deletes custom ones for now for simplicity,
    // or we handle standard deletion by effectively ignoring it in the UI but it comes back on reload?
    // Actually, let's strictly filter it content-wise.
  };

  return (
    <div className="card border-0 shadow-sm animate__animated animate__fadeIn">
      <div className="card-header bg-white p-3 border-bottom-0 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0 fw-bold text-primary">
            <i className="bi bi-keyboard me-2"></i>Keyboard Shortcuts
          </h5>
          <small className="text-muted">
            Manage global application shortcuts
          </small>
        </div>
      </div>
      <div className="card-body p-4 pt-0">
        <div
          className="table-responsive rounded-3 shadow-sm border"
          style={{ maxHeight: "60vh" }}
        >
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
              <tr>
                <th style={{ width: "25%" }}>Action Name</th>
                <th style={{ width: "15%" }}>Modifiers</th>
                <th style={{ width: "10%" }}>Key</th>
                <th style={{ width: "35%" }}>Function / Target Path</th>
                <th style={{ width: "15%" }} className="text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((s) => (
                <tr key={s.id}>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 bg-transparent fw-bold"
                      value={s.description}
                      onChange={(e) =>
                        updateShortcut(s.id, "description", e.target.value)
                      }
                      placeholder="Description"
                    />
                    {s.isCustom && (
                      <span
                        className="badge bg-info text-dark rounded-pill"
                        style={{ fontSize: "0.6em" }}
                      >
                        Custom
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-3">
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={s.ctrlKey}
                          onChange={(e) =>
                            updateShortcut(s.id, "ctrlKey", e.target.checked)
                          }
                          title="Ctrl / Cmd"
                        />
                        <label className="form-check-label small text-muted fw-bold">
                          Ctrl
                        </label>
                      </div>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={s.altKey}
                          onChange={(e) =>
                            updateShortcut(s.id, "altKey", e.target.checked)
                          }
                          title="Alt / Option"
                        />
                        <label className="form-check-label small text-muted fw-bold">
                          Alt
                        </label>
                      </div>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm text-center fw-bold font-monospace text-uppercase bg-light"
                      value={s.key}
                      maxLength={10}
                      onChange={(e) =>
                        updateShortcut(s.id, "key", e.target.value)
                      }
                      placeholder="KEY"
                    />
                  </td>
                  <td>
                    <div className="input-group input-group-sm">
                      <select
                        className="form-select bg-light fw-bold"
                        value={s.action}
                        onChange={(e) =>
                          updateShortcut(s.id, "action", e.target.value)
                        }
                        style={{ maxWidth: "110px" }}
                      >
                        <option value="navigate">Go To</option>
                        <option value="logout">Function</option>
                      </select>
                      {s.action === "navigate" ? (
                        <input
                          type="text"
                          className="form-control font-monospace"
                          value={s.target || ""}
                          onChange={(e) =>
                            updateShortcut(s.id, "target", e.target.value)
                          }
                          placeholder="/route-path"
                        />
                      ) : (
                        <select
                          className="form-select font-monospace"
                          value={s.action}
                          disabled
                        >
                          <option value="logout">Logout User</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="text-end">
                    {s.isCustom ? (
                      <button
                        className="btn btn-sm btn-outline-danger border-0 rounded-circle"
                        onClick={() => deleteShortcut(s.id)}
                        title="Remove Shortcut"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    ) : (
                      <small className="text-muted opacity-50">Standard</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between mt-4">
          <button className="btn btn-outline-secondary" onClick={handleReset}>
            <i className="bi bi-arrow-counterclockwise me-2"></i>Reset Defaults
          </button>
          <div>
            <button className="btn btn-success me-2" onClick={addShortcut}>
              <i className="bi bi-plus-lg me-2"></i>Add New
            </button>
            <button
              className="btn btn-primary px-4 fw-bold"
              onClick={handleSave}
            >
              <i className="bi bi-check-lg me-2"></i>Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsSettings;
