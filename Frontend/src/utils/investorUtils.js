import html2pdf from "html2pdf.js";
import { InvestorTemplate } from "./printTemplates/InvestorTemplate";

/**
 * exportInvestorPDF generates and downloads a certificate as PDF
 * Matching the frontend implementation for UI parity.
 */
export const exportInvestorPDF = (investor, branchData = null) => {
  const brandName = "Kumaran E-Services";

  // Try to get branch details from investor.branch (if populated) or fallbacks
  const branchInfo = investor.branch || branchData;
  const branchName =
    branchInfo?.name || branchInfo?.branchName || "Main Branch";
  const branchDetails = {
    name: brandName,
    branchName: branchName,
    contact: branchInfo?.contact?.phone || branchInfo?.contact || "0000000000",
    gstNumber: branchInfo?.gstNumber || "",
  };

  const currencySymbol = "₹";

  // Interest Calculations for the analytics section
  const principal = Number(investor.principalAmount || 0);
  const rate = Number(investor.interestRate || 0) / 100; // paise per ₹1 -> decimal
  const monthlyInterest = principal * rate;
  const yearlyInterest = monthlyInterest * 12;

  // Create a temporary container for rendering the PDF
  const element = document.createElement("div");
  element.style.width = "794px";
  element.style.padding = "20px";
  element.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
      * { box-sizing: border-box; }
      .investor-receipt { font-family: 'Inter', sans-serif; color: #1a1a1a; }
      .text-right { text-align: right; }
      .fw-bold { font-weight: 700; }
      .uppercase { text-transform: uppercase; }
      
      /* Dedicated PDF Styles */
      .pro-header { 
        background: #000 !important; 
        color: #fff !important; 
        padding: 40px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 40px; 
        border-radius: 0 0 20px 20px; 
      }
      .pro-logo-section h1 { margin: 0; font-size: 2.2rem; color: #fff !important; line-height: 1; }
      .pro-tagline { margin: 10px 0 0 0; opacity: 0.8; font-size: 0.9rem; color: #fff !important; }
      .title-accent { margin: 0; font-size: 2.8rem; font-weight: 900; letter-spacing: 4px; color: #fff !important; line-height: 1; }
      .pro-details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 30px; }
      .pro-label { font-size: 0.7rem; font-weight: 800; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
      .pro-table { width: 100%; border-collapse: collapse; }
      .pro-table th { background: #f1f5f9 !important; padding: 12px 15px; font-size: 0.8rem; color: #475569; text-transform: uppercase; }
      .pro-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
    </style>
    ${InvestorTemplate({
      investor,
      branchDetails,
      currencySymbol,
      monthlyInterest,
      yearlyInterest,
    })}
  `;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Investment_Certificate_${investor.name.replace(/\s+/g, "_")}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  // Generate and save the PDF
  html2pdf().set(opt).from(element).save();
};
