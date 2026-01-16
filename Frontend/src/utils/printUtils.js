import { getDecrypted } from "./storage";
import { StandardTemplate } from "./printTemplates/StandardTemplate";
import { ProfessionalTemplate } from "./printTemplates/ProfessionalTemplate";
import { ModernTemplate } from "./printTemplates/ModernTemplate";

/**
 * handlePrint handles the generation and printing of invoices.
 * Optimized for Black & White (Monochrome) but matching the exact preview layouts.
 * Removes browser headers/footers (like the URL at bottom).
 */
export const handlePrint = (sale, options = {}) => {
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
    address: storedBranch?.address
      ? [storedBranch.address.street, storedBranch.address.city]
          .filter((part) => part && part.trim())
          .join(", ")
      : "Local Branch St, City",
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
    0
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
    switch (settings.billTemplate) {
      case "professional":
        return ProfessionalTemplate(templateProps);
      case "preview":
        return ModernTemplate(templateProps);
      default:
        return StandardTemplate(templateProps);
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
            margin: ${
              settings.printMargin === "none"
                ? "0"
                : settings.printMargin || "0"
            };
            size: ${settings.paperSize || "A4"} ${
    settings.orientation || "portrait"
  };
          }
          
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: ${settings.printMargin === "none" ? "10mm" : "0"}; 
            color: #1a1a1a; 
            background: #fff;
            ${settings.colorMode === "bw" ? "filter: grayscale(1);" : ""}
          }

          .print-container { width: 100%; box-sizing: border-box; }
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
          .professional-style .pro-header { background: #000; color: #fff; padding: 30px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .professional-style .pro-logo-section h1 { margin: 0; font-size: 1.75rem; }
          .professional-style .pro-tagline { margin: 0; opacity: 0.8; font-size: 0.8rem; }
          .professional-style .title-accent { margin: 0; font-size: 2.5rem; font-weight: 800; letter-spacing: 2px; }
          .professional-style .pro-details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 30px; }
          .professional-style .pro-label { font-size: 0.7rem; font-weight: 700; color: #666; margin-bottom: 8px; text-transform: uppercase; }
          .professional-style .pro-table { width: 100%; border-collapse: collapse; }
          .professional-style .pro-table th { background: #f1f5f9; padding: 12px; font-size: 0.8rem; color: #444; }
          .professional-style .pro-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .professional-style .pro-footer { display: flex; justify-content: space-between; margin-top: 40px; }
          .professional-style .pro-totals { width: 350px; }
          .professional-style .pro-total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; font-weight: 600; }
          .professional-style .pro-grand-total { border-bottom: none; border-top: 2px solid #000; padding-top: 15px; font-size: 1.1rem; color: #000; }
          .professional-style .pro-grand-total span:last-child { font-size: 1.25rem; }

          /* Modern Style - Refined B&W */
          .modern-style .modern-top-bar { height: 8px; background: #000; margin-bottom: 30px; }
          .modern-style .modern-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
          .modern-style .modern-brand { display: flex; align-items: center; gap: 15px; }
          .modern-style .modern-logo { width: 45px; height: 45px; background: #000; color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; }
          .modern-style .modern-bill-badge { border: 2px solid #000; color: #000; padding: 5px 15px; border-radius: 20px; font-weight: 700; }
          .modern-style .modern-contacts { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .modern-style .modern-contact-card h5 { margin: 0 0 8px 0; color: #888; font-size: 0.75rem; letter-spacing: 1px; text-transform: uppercase; }
          .modern-style .modern-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
          .modern-style .modern-table td { background: #f8fafc; padding: 15px; font-weight: 600; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
          .modern-style .modern-table td:first-child { border-radius: 12px 0 0 12px; border-left: 1px solid #eee; }
          .modern-style .modern-table td:last-child { border-radius: 0 12px 12px 0; border-right: 1px solid #eee; }

          /* Global Footer Elements */
          .totals-box { width: 280px; margin-left: auto; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 0.95rem; }
          .grand-total, .modern-total { font-weight: 800; font-size: 1.25rem; border-top: 2px solid #000; margin-top: 10px; padding-top: 10px !important; }

          @media print {
            body { padding: 10mm; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

  // --- Electron Direct Print Handling ---
  if (window.electron && window.electron.print) {
    const isSilent = options.silent || settings.autoPrint;
    window.electron.print({
      html,
      silent: isSilent,
      printerName: settings.selectedPrinter || null,
    });
    return;
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
