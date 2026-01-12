/**
 * Printer Service Bridge
 * This service handles communication with system printers.
 * It detects if the app is running in an Electron environment and fetches real printers.
 * Falls back to "System Default" in browser environments.
 */

export const getSystemPrinters = async () => {
  // Check if we are in Electron environment
  if (window.electron && window.electron.getPrinters) {
    try {
      return await window.electron.getPrinters();
    } catch (error) {
      console.error("Failed to fetch Electron printers:", error);
      return [];
    }
  }

  // Fallback for Web Browser
  return [{ name: "System Default Printer", isDefault: true, status: "Ready" }];
};

export const printToScale = (html, printerName = null) => {
  if (window.electron && window.electron.print) {
    window.electron.print({ html, printerName });
    return true;
  }

  // Browser fallback
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
  return false;
};
