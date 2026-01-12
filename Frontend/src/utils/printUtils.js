import { getDecrypted } from "./storage";

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
  const branchDetails = {
    name: storedBranch?.name || "Kumaran E-Services",
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

  const getTemplateContent = () => {
    // Robustly handle numerical values to prevent .toFixed errors
    const amount = Number(sale.amount || 0);
    const tax = Number(sale.totalTax || 0);
    const discount = Number(sale.discount || 0);

    // Sum of item totals to detect rounding
    const itemsTotal = (sale.products || []).reduce(
      (sum, p) => sum + Number(p.lineTotal || 0),
      0
    );
    const roundingValue = amount - itemsTotal;

    // Subtotal = Amount - Tax + Discount (This matches the math in the provided screenshot)
    const subtotal = amount - tax + discount - roundingValue;

    switch (settings.billTemplate) {
      case "professional":
        return `
          <div class="invoice-box professional-style">
            <div class="pro-header">
              <div class="pro-logo-section">
                <h1>${branchDetails.name}</h1>
                <p class="pro-tagline">Professional Business Services</p>
              </div>
              <div class="pro-invoice-title text-right">
                <h2 class="title-accent">INVOICE</h2>
                <p class="bill-no-accent">Invoice No: ${sale.billNo}</p>
              </div>
            </div>
            
            <div class="pro-details-grid">
              <div class="pro-detail-col">
                <h4 class="pro-label">OUR DETAILS</h4>
                <p>${branchDetails.address}</p>
                <p>Contact: ${branchDetails.contact}</p>
                ${
                  branchDetails.gstNumber
                    ? `<p>GSTIN: ${branchDetails.gstNumber}</p>`
                    : ""
                }
              </div>
              <div class="pro-detail-col">
                <h4 class="pro-label">BILL TO</h4>
                <p><strong>${sale.customerName}</strong></p>
                <p>${sale.customerPhone}</p>
              </div>
              <div class="pro-detail-col text-right">
                <h4 class="pro-label">DATE</h4>
                <p>${sale.formattedDate}</p>
                <p>${sale.time}</p>
                <p style="margin-top: 10px;"><strong>Billed By:</strong> ${staffName}</p>
              </div>
            </div>

            <table class="pro-table">
              <thead>
                <tr>
                  <th>DESCRIPTION</th>
                  <th class="text-center">QTY</th>
                  <th class="text-right">RATE</th>
                  <th class="text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${(sale.products || [])
                  .map(
                    (p) => `
                  <tr>
                    <td>
                      <div class="pro-item-name">${p.name || "Item"}0</div>
                      ${
                        p.sku
                          ? `<small class="pro-item-sku">${p.sku}</small>`
                          : ""
                      }
                    </td>
                    <td class="text-center">${p.qty || 0}</td>
                    <td class="text-right">${currencySymbol}${Number(
                      p.price || 0
                    ).toFixed(2)}</td>
                    <td class="text-right">${currencySymbol}${Number(
                      p.lineTotal || 0
                    ).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="pro-footer">
              <div class="pro-payment-info">
                <h4 class="pro-label">PAYMENT METHOD</h4>
                <p>${sale.paymentMode || "Cash"} - ${sale.status || "Paid"}</p>
              </div>
              <div class="pro-totals">
                <div class="pro-total-row"><span>SUB TOTAL</span><span>${currencySymbol}${subtotal.toFixed(
          2
        )}</span></div>
                ${
                  discount > 0
                    ? `<div class="pro-total-row" style="color: #000;"><span>DISCOUNT (-)</span><span>${currencySymbol}${discount.toFixed(
                        2
                      )}</span></div>`
                    : ""
                }
                <div class="pro-total-row"><span>TAX (GST)</span><span>${currencySymbol}${tax.toFixed(
          2
        )}</span></div>
                ${
                  Math.abs(roundingValue) > 0.01
                    ? `<div class="pro-total-row"><span>ROUNDING</span><span>${currencySymbol}${roundingValue.toFixed(
                        2
                      )}</span></div>`
                    : ""
                }
                <div class="pro-total-row pro-grand-total"><span>TOTAL AMOUNT</span><span>${currencySymbol}${amount.toFixed(
          2
        )}</span></div>
              </div>
            </div>
          </div>
        `;
      case "preview": // Modern Style
        return `
          <div class="invoice-box modern-style">
            <div class="modern-top-bar"></div>
            <div class="modern-body">
              <div class="modern-header">
                <div class="modern-brand">
                  <div class="modern-logo">${branchDetails.name.charAt(0)}</div>
                  <h2>${branchDetails.name}</h2>
                </div>
                <div class="modern-meta">
                  <span class="modern-bill-badge">INV-${sale.billNo}</span>
                  <p class="modern-date">${sale.formattedDate}</p>
                </div>
              </div>
              
              <div class="modern-contacts">
                <div class="modern-contact-card">
                  <h5>FROM</h5>
                  <p><strong>${branchDetails.name}</strong></p>
                  <p class="sub">${branchDetails.address}</p>
                </div>
                <div class="modern-contact-card">
                  <h5>FOR</h5>
                  <p><strong>${sale.customerName}</strong></p>
                  <p class="sub">${sale.customerPhone}</p>
                </div>
              </div>

              <div class="modern-table-container">
                <table class="modern-table">
                  <thead>
                    <tr>
                      <th style="padding-left: 15px;">ITEM</th>
                      <th class="text-center">QTY</th>
                      <th class="text-right" style="padding-right: 15px;">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(sale.products || [])
                      .map(
                        (p) => `
                      <tr>
                        <td style="padding-left: 15px;">${p.name || "Item"}</td>
                        <td class="text-center">${p.qty || 0}</td>
                        <td class="text-right" style="padding-right: 15px;">${currencySymbol}${Number(
                          p.lineTotal || 0
                        ).toFixed(2)}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>

              <div class="modern-summary">
                <div class="modern-summary-item"><span>Subtotal</span><span>${currencySymbol}${subtotal.toFixed(
          2
        )}</span></div>
                ${
                  discount > 0
                    ? `<div class="modern-summary-item"><span>Discount Applied</span><span>-${currencySymbol}${discount.toFixed(
                        2
                      )}</span></div>`
                    : ""
                }
                <div class="modern-summary-item"><span>GST Amount</span><span>${currencySymbol}${tax.toFixed(
          2
        )}</span></div>
                ${
                  Math.abs(roundingValue) > 0.01
                    ? `<div class="modern-summary-item"><span>Rounding</span><span>${currencySymbol}${roundingValue.toFixed(
                        2
                      )}</span></div>`
                    : ""
                }
                <div class="modern-summary-item modern-total"><span>TOTAL PAYABLE</span><span>${currencySymbol}${amount.toFixed(
          2
        )}</span></div>
                <div class="modern-summary-item" style="border-top: 1px dashed #ddd; margin-top: 10px; padding-top: 5px;">
                  <span>Billed By:</span>
                  <span>${staffName}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      default: // Standard Style
        return `
          <div class="invoice-box standard-style">
            <div class="invoice-header">
              <div class="branch-info">
                <h2>${branchDetails.name}</h2>
                <p>${branchDetails.address}</p>
                <p>Ph: ${branchDetails.contact}</p>
                ${
                  branchDetails.gstNumber
                    ? `<p><strong>GSTIN: ${branchDetails.gstNumber}</strong></p>`
                    : ""
                }
              </div>
              <div class="bill-info text-right">
                <h1>TAX INVOICE</h1>
                <p># ${sale.billNo}</p>
                <p>${sale.formattedDate}</p>
              </div>
            </div>
            <div class="customer-section">
               <div>
                 <small class="text-muted d-block uppercase" style="font-size: 0.65rem; color: #666;">BILL TO</small>
                 <strong>${sale.customerName}</strong>
                 <p>${sale.customerPhone}</p>
               </div>
               <div style="text-align: right;">
                 <small class="text-muted d-block uppercase" style="font-size: 0.65rem; color: #666;">PAYMENT</small>
                 <strong>${sale.paymentMode || "Unknown"}</strong>
                 <p>${sale.status || "Paid"}</p>
                 <p style="margin-top: 5px; font-size: 0.8rem; color: #444;">Billed By: ${staffName}</p>
               </div>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(sale.products || [])
                  .map(
                    (p) => `
                  <tr>
                    <td><b>${p.name || "Item"}</b></td>
                    <td class="text-center">${p.qty || 0}</td>
                    <td class="text-right">${currencySymbol}${Number(
                      p.price || 0
                    ).toFixed(2)}</td>
                    <td class="text-right">${currencySymbol}${Number(
                      p.lineTotal || 0
                    ).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="invoice-footer" style="display: flex; justify-content: space-between; margin-top: 30px;">
               <div class="notes" style="width: 50%;">
                 <p><b>Terms & Conditions:</b></p>
                 <p style="font-size: 0.8rem;">1. Goods once sold will not be taken back.<br>2. Subject to local jurisdiction.</p>
               </div>
               <div class="totals-box">
                 <div class="total-row"><span>Subtotal</span><span>${currencySymbol}${subtotal.toFixed(
          2
        )}</span></div>
                 ${
                   discount > 0
                     ? `<div class="total-row"><span>Discount (-)</span><span>${currencySymbol}${discount.toFixed(
                         2
                       )}</span></div>`
                     : ""
                 }
                 <div class="total-row"><span>GST</span><span>${currencySymbol}${tax.toFixed(
          2
        )}</span></div>
                 ${
                   Math.abs(roundingValue) > 0.01
                     ? `<div class="total-row"><span>Rounding</span><span>${currencySymbol}${roundingValue.toFixed(
                         2
                       )}</span></div>`
                     : ""
                 }
                 <div class="total-row grand-total"><span>GRAND TOTAL</span><span>${currencySymbol}${amount.toFixed(
          2
        )}</span></div>
               </div>
            </div>
          </div>
        `;
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
            size: ${settings.paperSize || "auto"} ${
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
          .standard-style .items-table th { background: #f8f9fa; padding: 12px; border-bottom: 1px solid #000; text-align: left; font-size: 0.8rem; text-transform: uppercase; }
          .standard-style .items-table td { padding: 12px; border-bottom: 1px solid #eee; }

          /* Professional Style - B&W High Contrast */
          .professional-style .pro-header { background: #000; color: #fff; padding: 30px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .professional-style .pro-logo-section h1 { margin: 0; font-size: 1.75rem; }
          .professional-style .pro-tagline { margin: 0; opacity: 0.8; font-size: 0.8rem; }
          .professional-style .title-accent { margin: 0; font-size: 2.5rem; font-weight: 800; letter-spacing: 2px; }
          .professional-style .pro-details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 30px; }
          .professional-style .pro-label { font-size: 0.7rem; font-weight: 700; color: #666; margin-bottom: 8px; text-transform: uppercase; }
          .professional-style .pro-table { width: 100%; border-collapse: collapse; }
          .professional-style .pro-table th { background: #f1f5f9; padding: 12px; font-size: 0.8rem; color: #444; text-align: left; }
          .professional-style .pro-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .professional-style .pro-footer { display: flex; justify-content: space-between; margin-top: 30px; }

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
          .grand-total, .pro-grand-total, .modern-total { font-weight: 800; font-size: 1.25rem; border-top: 2px solid #000; margin-top: 10px; padding-top: 10px !important; }

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
