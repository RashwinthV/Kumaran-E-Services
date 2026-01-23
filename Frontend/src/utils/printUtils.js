import { getDecrypted } from "./storage";
import { StandardTemplate } from "./printTemplates/StandardTemplate";
import { ProfessionalTemplate } from "./printTemplates/ProfessionalTemplate";
import { ModernTemplate } from "./printTemplates/ModernTemplate";

/**
 * handlePrint handles the generation and printing of invoices.
 * Optimized for Black & White (Monochrome) but matching the exact preview layouts.
 * Removes browser headers/footers (like the URL at bottom).
 */
export const handlePrint = async (sale, options = {}) => {
  const settings = getDecrypted("app_settings") || {
    paperSize: "A4",
    billTemplate: "standard",
  };

  const storedBranch = getDecrypted("branch");
  const brandName = "Kumaran E-Services";
  const branchName = storedBranch?.name || "Main Branch";
  const branchDetails = {
    name: brandName,
    branchName: branchName,

    contact:
      storedBranch?.contact?.phone || storedBranch?.contact || "0000000000",
    gstNumber: storedBranch?.gstNumber || "",
  };

  const currencySymbol = settings.currency
    ? settings.currency.match(/\(([^)]+)\)/)?.[1] || "₹"
    : "₹";
  const paperClass = settings.paperSize.toLowerCase();
  const staffName = sale.staffName || sale.staff?.name || "Staff";

  // Calculations
  const amount = Number(sale.amount || 0);
  const tax = Number(sale.totalTax || 0);
  const discount = Number(sale.discount || 0);
  const itemsTotal = (sale.products || []).reduce(
    (sum, p) => sum + Number(p.lineTotal || 0),
    0,
  );
  const roundingValue = amount - itemsTotal;
  const subtotal = amount - tax + discount - roundingValue;

  const templateProps = {
    sale,
    branchDetails,
    currencySymbol,
    subtotal,
    tax,
    discount,
    roundingValue,
    amount,
    staffName,
  };

  const getTemplateContent = () => {
    let templateId = settings.billTemplate;

    // Support dynamic template lookup based on Paper Size
    if (templateId === "dynamic") {
      templateId = settings.templateMap?.[settings.paperSize] || "standard";
    }

    // Determine if it's an A5 variant (from ID or Paper Size)
    const isA5 = settings.paperSize === "A5" || templateId.includes("_a5");

    switch (templateId) {
      case "professional":
      case "professional_a5":
        return ProfessionalTemplate({ ...templateProps, isA5 });
      case "preview":
      case "modern":
      case "modern_a5":
        return ModernTemplate({ ...templateProps, isA5 });
      case "standard":
      case "standard_a5":
        return StandardTemplate({ ...templateProps, isA5 });
      default:
        // Fallback to standard if templateId is unknown
        return StandardTemplate({ ...templateProps, isA5 });
    }
  };

  const html = `
    <html>
      <head>
        <title>Invoice - ${sale.billNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          
          /* Force hide browser headers/footers and set paper size/orientation/margins */
          @page {
            margin: 0; /* Let the body padding handle margins for better control */
            size: ${settings.paperSize || "A4"} ${
              settings.orientation || "portrait"
            };
          }
          
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 0;
            color: #1a1a1a; 
            background: #fff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            ${
              settings.colorMode === "bw"
                ? "filter: grayscale(1) !important;"
                : ""
            }
          }

          .print-container { 
            width: 100%; 
            box-sizing: border-box; 
            padding: ${
              settings.printMargin === "none"
                ? "5mm"
                : settings.printMargin || "10mm"
            };
          }
          .a5 .pro-header { padding: 15px !important; margin-bottom: 15px !important; margin-left: -2px; margin-right: -2px; }
          .a5 .pro-details-grid { gap: 10px !important; margin-bottom: 15px !important; }
          .a5 .pro-table td, .a5 .pro-table th { padding: 6px 8px !important; font-size: 0.75rem !important; }
          .a5 .title-accent { font-size: 1.5rem !important; }
          .a5 .pro-totals { width: 100% !important; max-width: 250px; }

          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .uppercase { text-transform: uppercase; }

          /* Standard Style */
          .standard-style .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .standard-style h1 { margin: 0; font-size: 1.5rem; font-weight: 800; }
          .standard-style .customer-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .standard-style .items-table { width: 100%; border-collapse: collapse; }
          .standard-style .items-table th { background: #f8f9fa; padding: 12px; border-bottom: 1px solid #000; font-size: 0.8rem; text-transform: uppercase; }
          .standard-style .items-table td { padding: 12px; border-bottom: 1px solid #eee; }

          /* Professional Style - B&W High Contrast */
          .professional-style .pro-header { background: #000 !important; color: #fff !important; padding: 30px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; -webkit-print-color-adjust: exact; }
          .professional-style .pro-logo-section h1 { margin: 0; font-size: 1.75rem; color: #fff !important; }
          .professional-style .pro-tagline { margin: 0; opacity: 0.8; font-size: 0.8rem; color: #fff !important; }
          .professional-style .title-accent { margin: 0; font-size: 2.5rem; font-weight: 800; letter-spacing: 2px; color: #fff !important; }
          .professional-style .pro-details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 30px; }
          .professional-style .pro-label { font-size: 0.7rem; font-weight: 700; color: #666; margin-bottom: 8px; text-transform: uppercase; }
          .professional-style .pro-table { width: 100%; border-collapse: collapse; }
          .professional-style .pro-table th { background: #f1f5f9 !important; padding: 12px; font-size: 0.8rem; color: #444; -webkit-print-color-adjust: exact; }
          .professional-style .pro-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .professional-style .pro-footer { display: flex; justify-content: space-between; margin-top: 10px; break-inside: avoid; }
          .professional-style .pro-totals { width: 350px; }
          .professional-style .pro-total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; font-weight: 600; }
          .professional-style .pro-grand-total { border-bottom: none; border-top: 2px solid #000; padding-top: 15px; font-size: 1.1rem; color: #000; }
          .professional-style .pro-grand-total span:last-child { font-size: 1.25rem; }

          /* Modern Style - Refined B&W */
          .modern-style .modern-top-bar { height: 8px; background: #000 !important; margin-bottom: 30px; -webkit-print-color-adjust: exact; }
          .modern-style .modern-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
          .modern-style .modern-brand { display: flex; align-items: center; gap: 15px; }
          .modern-style .modern-logo { width: 45px; height: 45px; background: #000 !important; color: #fff !important; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; -webkit-print-color-adjust: exact; }
          .modern-style .modern-meta { text-align: right; }
          .modern-style .modern-bill-badge { border: 2px solid #000; color: #000; padding: 6px 18px; border-radius: 20px; font-weight: 700; white-space: nowrap; display: inline-block; font-size: 0.85rem; }
          .modern-style .modern-contacts { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .modern-style .modern-contact-card h5 { margin: 0 0 8px 0; color: #888; font-size: 0.75rem; letter-spacing: 1px; text-transform: uppercase; }
          .modern-style .modern-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
          .modern-style .modern-table td { background: #f8fafc !important; padding: 15px; font-weight: 600; border-top: 1px solid #eee; border-bottom: 1px solid #eee; -webkit-print-color-adjust: exact; }
          .modern-style .modern-table td:first-child { border-radius: 12px 0 0 12px; border-left: 1px solid #eee; }
          .modern-style .modern-table td:last-child { border-radius: 0 12px 12px 0; border-right: 1px solid #eee; }
          .modern-style .modern-summary { display: flex; flex-direction: column; align-items: flex-end; margin-top: 20px; }
          .modern-style .modern-summary-item { display: flex; justify-content: space-between; width: 250px; padding: 10px 0; font-size: 0.9rem; color: #666; border-bottom: 1px solid #f1f5f9; }
          .modern-style .modern-total { border-top: 2px solid #000; border-bottom: none; color: #000; font-weight: 800; font-size: 1.25rem; padding-top: 15px !important; margin-top: 5px; }
          .modern-style .modern-footer-grid { display: grid; grid-template-columns: 1fr 250px; gap: 40px; margin-top: 30px; }
          .modern-style .modern-terms h5 { margin: 0 0 10px 0; font-size: 0.8rem; color: #000; text-transform: uppercase; letter-spacing: 1px; }
          .modern-style .modern-terms p { margin: 0; font-size: 0.75rem; color: #666; line-height: 1.5; }
          .modern-style .modern-staff-tag { margin-top: 12px; padding: 6px 12px; background: #f1f5f9; border-radius: 6px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 600; color: #475569; border: 1px solid #e2e8f0; }

          /* Global Footer Elements */
          .totals-box { width: 280px; margin-left: auto; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 0.95rem; }
          .grand-total, .modern-total { font-weight: 800; font-size: 1.25rem; border-top: 2px solid #000; margin-top: 10px; padding-top: 10px !important; }

          @media print {
            body { padding: 0; margin: 0; background: #fff; }
            .print-container { 
               width: 100% !important; 
               height: auto !important; 
               overflow: visible !important;
               padding: 8mm !important; /* Safety margin for physical printers */
            }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-container ${paperClass}">
          ${getTemplateContent()}
        </div>
      </body>
    </html>
  `;

  const isSilent = options.silent || settings.autoPrint;

  // --- Electron Direct Print Handling (Desktop App) ---
  // Only use IPC for silent/auto-print. For manual print, we rely on the renderer's window.print()
  // which now uses Chrome's native preview (thanks to enable-print-preview switch in main).
  if (
    window.electron &&
    window.electron.print &&
    isSilent &&
    !options.forceBrowserPrint
  ) {
    try {
      await window.electron.print({
        html,
        silent: true,
        printerName:
          settings.selectedPrinter !== "System Default Printer"
            ? settings.selectedPrinter
            : null,
        color: settings.colorMode !== "bw",
        pageSize: settings.paperSize || "A4",
        landscape: settings.orientation === "landscape",
      });
      return; // Stop here if silent print was successful
    } catch (error) {
      console.error("Electron print error:", error);
      // If silent print fails, fall through to dialog
    }
  }

  // --- Browser Iframe Handling ---
  let iframe = document.getElementById("print-iframe");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "print-iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 500);
};
