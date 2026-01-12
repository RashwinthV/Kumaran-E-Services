import React, { useState, useMemo, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import SaleHistoryStats from "../../Components/SaleHistory/SaleHistoryStats";
import SaleHistoryFilters from "../../Components/SaleHistory/SaleHistoryFilters";
import SaleHistoryTable from "../../Components/SaleHistory/SaleHistoryTable";
import SaleHistoryDetailModal from "../../Components/SaleHistory/SaleHistoryDetailModal";
import RefundModal from "../../Components/SaleHistory/RefundModal";
import SaleHistoryPagination from "../../Components/SaleHistory/SaleHistoryPagination";
import { useBilling } from "../../Context/BillingContext";
import { toast } from "react-toastify";
import Loader from "../../Components/Loading/universalLoader";
import { getDecrypted } from "../../utils/storage";

const getCurrencySymbol = (settingValue) => {
  if (!settingValue) return "₹"; // Default
  const match = settingValue.match(/\(([^)]+)\)/);
  return match ? match[1] : settingValue;
};

const formatDate = (dateStr, format) => {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [y, m, d] = dateStr.split("-");
  if (format === "DD/MM/YYYY") return `${d}/${m}/${y}`;
  if (format === "MM/DD/YYYY") return `${m}/${d}/${y}`;
  return dateStr; // YYYY-MM-DD
};

const SaleHistory = () => {
  const {
    sales,
    refunds,
    loading: billingLoading,
    refreshSales,
  } = useBilling();

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = (new Date().getMonth() + 1).toString();
  const currentYear = new Date().getFullYear().toString();

  const [filters, setFilters] = useState({
    search: "",
    startDate: "", // Default to empty to allow Month/Year filter to work
    endDate: "",
    paymentMode: "All",
    status: "All",
    sortBy: "Newest",
    month: currentMonth,
    year: currentYear,
  });

  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [appSettings, setAppSettings] = useState(() =>
    getDecrypted("app_settings")
  );
  const [branchInfo, setBranchInfo] = useState(() => getDecrypted("branch"));

  useEffect(() => {
    if (!appSettings) {
      const saved = getDecrypted("app_settings");
      if (saved) setAppSettings(saved);
    }
    if (!branchInfo) {
      const branch = getDecrypted("branch");
      if (branch) setBranchInfo(branch);
    }
  }, [appSettings, branchInfo]);

  const currencySymbol = useMemo(
    () => getCurrencySymbol(appSettings?.currency),
    [appSettings]
  );

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Map Backend Data to UI Format
  const mappedSales = useMemo(() => {
    return sales.map((sale) => {
      const createdDate = new Date(sale.createdAt);
      return {
        id: sale._id,
        billNo: sale.billNumber,
        date: createdDate.toISOString().split("T")[0], // Keep for filters
        formattedDate: formatDate(
          createdDate.toISOString().split("T")[0],
          appSettings?.dateFormat || "DD/MM/YYYY"
        ),
        time: createdDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        customerName: sale.customer?.name || "Walk-in Customer",
        customerPhone: sale.customer?.phone || "N/A",
        itemsCount: sale.items?.length || 0,
        amount: sale.grandTotal,
        paymentMode: sale.paymentMethod?.type || "Unknown",
        status: sale.status === "Completed" ? "Paid" : sale.status,
        products:
          sale.items?.map((item) => {
            const tax = item.taxAmount || 0;
            // Support legacy records where taxableValue might be missing
            const taxableValue = item.taxableValue || item.lineTotal - tax;
            const cgst = Number((tax / 2).toFixed(2));
            const sgst = Number((tax - cgst).toFixed(2));

            return {
              name: item.product?.name || "Unknown Product",
              sku: item.product?.sku || "N/A",
              qty: item.qty,
              price: item.price,
              lineTotal: item.lineTotal,
              taxAmount: tax,
              taxableValue: taxableValue,
              cgst: cgst,
              sgst: sgst,
              gstRate: item.product?.gst
                ? item.product.gst.cgst + item.product.gst.sgst
                : 0,
              gstType: item.product?.gstType || "NotIncluded",
              refundedQty: item.refundedQty || 0,
              discount: item.discount || 0,
            };
          }) || [],
        // Extra info for the detail modal if needed
        subtotal: sale.subtotal,
        totalTax: sale.totalTax,
        cgstTotal: Number((sale.totalTax / 2).toFixed(2)),
        sgstTotal: Number((sale.totalTax - sale.totalTax / 2).toFixed(2)),
        discount:
          sale.items?.reduce((acc, item) => acc + (item.discount || 0), 0) || 0,
        totalRefundedAmount: sale.totalRefundedAmount || 0,
        cashRefundAmount: sale.cashRefundAmount || 0,
        paidAmount:
          sale.status === "Completed" ? sale.grandTotal : sale.paidAmount || 0,
        staffName: sale.staff?.name || "Staff",
        // Carry internal IDs and field for the refund logic
        items: sale.items || [],
      };
    });
  }, [sales, appSettings]);

  const availableYears = useMemo(() => {
    const years = sales.map((sale) => new Date(sale.createdAt).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  }, [sales]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      if (key === "month" || key === "year") {
        // If interacting with Month/Year, clear specific dates
        newFilters.startDate = "";
        newFilters.endDate = "";
      } else if (key === "startDate" || key === "endDate") {
        // If interacting with Dates, set Month/Year to All
        newFilters.month = "All";
        newFilters.year = "All";
      }

      return newFilters;
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters({
      search: "",
      startDate: "",
      endDate: "",
      paymentMode: "All",
      status: "All",
      sortBy: "Newest",
      month: currentMonth,
      year: currentYear,
    });
    setCurrentPage(1);
  };

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const handleOpenRefund = (sale) => {
    setSelectedSale(sale);
    setIsRefundModalOpen(true);
  };

  const { refundSale } = useBilling();

  const handleProcessRefund = async (refundData) => {
    const result = await refundSale(refundData);
    if (result.success) {
      toast.success(result.message);
      setIsRefundModalOpen(false);
      setIsModalOpen(false); // Close detail modal too if it was open
    } else {
      toast.error(result.message);
    }
  };

  const handleExport = async () => {
    if (filteredData.length === 0) {
      return alert("No data to export");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales History");

    // Add Branch Info Header
    if (branchInfo) {
      const bNameRow = worksheet.addRow([branchInfo.name?.toUpperCase()]);
      bNameRow.font = { bold: true, size: 18 };
      worksheet.mergeCells(`A${bNameRow.number}:N${bNameRow.number}`);
      bNameRow.alignment = { horizontal: "center" };

      const bAddrRow = worksheet.addRow([
        `${branchInfo.address?.street || ""}, ${
          branchInfo.address?.city || ""
        }`,
      ]);
      bAddrRow.font = { size: 12 };
      worksheet.mergeCells(`A${bAddrRow.number}:N${bAddrRow.number}`);
      bAddrRow.alignment = { horizontal: "center" };

      const bContactRow = worksheet.addRow([
        `Contact: ${branchInfo.contact?.phone || branchInfo.contact || "N/A"}`,
      ]);
      bContactRow.font = { size: 12 };
      worksheet.mergeCells(`A${bContactRow.number}:N${bContactRow.number}`);
      bContactRow.alignment = { horizontal: "center" };

      worksheet.addRow([]); // Spacer
    }

    // Define Base Columns (for width only, we will add headers manually)
    const columns = [
      { header: "Bill Number", key: "billNo", width: 25 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customerName", width: 20 },
      { header: "Phone", key: "customerPhone", width: 15 },
      { header: "Product Code", key: "sku", width: 15 },
      { header: "Product Name", key: "name", width: 30 },
      { header: "Qty", key: "qty", width: 10 },
      { header: "Rate", key: "price", width: 15 },
      { header: "Taxable Value", key: "taxableValue", width: 40 },
      { header: "CGST", key: "cgst", width: 12 },
      { header: "SGST", key: "sgst", width: 12 },
      { header: "Line Total", key: "lineTotal", width: 18 },
      { header: "Mode", key: "paymentMode", width: 12 },
      { header: "Status", key: "status", width: 12 },
    ];
    worksheet.columns = columns.map((c) => ({ key: c.key, width: c.width }));

    const addTableSection = (title, data) => {
      if (data.length === 0) return;

      // Section Title
      const titleRow = worksheet.addRow([title]);
      titleRow.font = { bold: true, size: 16, color: { argb: "FF1F4E78" } };
      worksheet.mergeCells(`A${titleRow.number}:N${titleRow.number}`);
      titleRow.alignment = { horizontal: "center" };
      worksheet.addRow([]); // Spacer

      // Header Row
      const headerRow = worksheet.addRow(columns.map((c) => c.header));
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F81BD" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Data Rows
      data.forEach((item) => {
        const row = worksheet.addRow(item);
        row.font = { size: 13 };
        // Set Data Font Size
        row.font = { size: 13 };

        // Style numerical cells
        [8, 9, 10, 11, 12].forEach((colIndex) => {
          const cell = row.getCell(colIndex);
          cell.numFmt = `"${currencySymbol}"#,##0.00`;
        });
        // Borders
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      worksheet.addRow([]); // Grid Spacer
      worksheet.addRow([]); // Large Spacer
    };

    // Prepare Data
    const inclusiveRows = [];
    const exclusiveRows = [];
    const nonGstRows = [];

    filteredData.forEach((sale) => {
      sale.products.forEach((p) => {
        // Determine item-level status for the row
        let itemStatus = sale.status;
        if (p.refundedQty >= p.qty) {
          itemStatus = "Refunded";
        } else if (p.refundedQty > 0) {
          itemStatus = "Partially Refunded";
        } else if (["Refunded", "Partially Refunded"].includes(sale.status)) {
          // If the bill has refunds but THIS item doesn't, it's effectively Paid
          itemStatus = "Paid";
        }

        const rowData = [
          sale.billNo,
          sale.formattedDate,
          sale.customerName,
          sale.customerPhone,
          p.sku,
          p.name,
          p.qty,
          p.price,
          p.taxableValue,
          p.cgst,
          p.sgst,
          p.lineTotal,
          sale.paymentMode,
          itemStatus,
        ];
        if (p.gstType === "Included") {
          inclusiveRows.push(rowData);
        } else if (p.gstType === "NotIncluded") {
          exclusiveRows.push(rowData);
        } else {
          nonGstRows.push(rowData);
        }
      });
    });

    // === REFUND SECTION ===
    const refundRows = refunds
      .filter((r) => {
        const rDate = new Date(r.createdAt).toISOString().split("T")[0];
        const matchesDate =
          (!filters.startDate || rDate >= filters.startDate) &&
          (!filters.endDate || rDate <= filters.endDate);

        const saleDate = new Date(rDate);
        const matchesMonth =
          filters.month === "All" ||
          (saleDate.getMonth() + 1).toString() === filters.month;
        const matchesYear =
          filters.year === "All" ||
          saleDate.getFullYear().toString() === filters.year;

        const matchesSearch =
          !filters.search ||
          r.originalSale?.billNumber
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          r.reason?.toLowerCase().includes(filters.search.toLowerCase());

        return matchesDate && matchesMonth && matchesYear && matchesSearch;
      })
      .map((r) => {
        const itemNames = r.items
          .map((i) => i.product?.name || "Product")
          .join(", ");
        const skus = r.items.map((i) => i.product?.sku || "N/A").join(", ");
        const rDate = new Date(r.createdAt);
        return [
          r.originalSale?.billNumber || r.billNumber || "N/A",
          rDate.toLocaleDateString(),
          r.customer?.name || "Walk-in",
          r.customer?.phone || "N/A",
          skus,
          itemNames,
          r.items.reduce((acc, i) => acc + i.qty, 0),
          r.totalRefundedAmount,
          r.reason || "N/A",
          r.staff?.name || "Staff",
        ];
      });

    // Generate Sections
    addTableSection("=== GST INCLUSIVE SALES ===", inclusiveRows);
    addTableSection("=== GST EXCLUSIVE SALES ===", exclusiveRows);
    addTableSection("=== GST NOT APPLICABLE / NON-GST SALES ===", nonGstRows);

    if (refundRows.length > 0) {
      // Define specific headers for Refund section
      const refundHeaders = [
        "Bill Number",
        "Date",
        "Customer",
        "Phone",
        "Product Code",
        "Product Name",
        "Qty",
        "Total Refunded",
        "Reason",
        "Processed By",
      ];

      const refundTitleRow = worksheet.addRow(["=== REFUND TRANSACTIONS ==="]);
      refundTitleRow.font = {
        bold: true,
        size: 16,
        color: { argb: "FFFF0000" },
      };
      worksheet.mergeCells(
        `A${refundTitleRow.number}:J${refundTitleRow.number}`
      );
      refundTitleRow.alignment = { horizontal: "center" };
      worksheet.addRow([]);

      const rHead = worksheet.addRow(refundHeaders);
      rHead.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
      rHead.eachCell((c) => {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFC00000" },
        };
        c.alignment = { vertical: "middle", horizontal: "center" };
        c.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      refundRows.forEach((row) => {
        const rRow = worksheet.addRow(row);
        rRow.font = { size: 13 };
        // Total Refunded is at index 8 (1-indexed based on row array starting at 0)
        const totalCell = rRow.getCell(8);
        totalCell.numFmt = `"${currencySymbol}"#,##0.00`;
        rRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });
    }

    // Generate Dynamic Filename
    const monthNames = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let fileName = "Sales_Report";

    if (filters.startDate === filters.endDate && filters.startDate) {
      fileName += `_${filters.startDate}`;
    } else if (filters.startDate && filters.endDate) {
      fileName += `_${filters.startDate}_to_${filters.endDate}`;
    } else if (filters.month !== "All" || filters.year !== "All") {
      if (filters.month !== "All")
        fileName += `_${monthNames[parseInt(filters.month)]}`;
      if (filters.year !== "All") fileName += `_${filters.year}`;
    }

    if (filters.paymentMode !== "All") fileName += `_${filters.paymentMode}`;
    if (filters.status !== "All") fileName += `_${filters.status}`;

    // Generate and Save File
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${fileName}.xlsx`);
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    return mappedSales
      .filter((item) => {
        // Search
        const matchesSearch =
          item.billNo.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.customerName
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          item.customerPhone.includes(filters.search);

        // Payment Mode (Case Insensitive Fix)
        const matchesMode =
          filters.paymentMode === "All" ||
          item.paymentMode.toLowerCase() === filters.paymentMode.toLowerCase();

        // Status
        const matchesStatus =
          filters.status === "All" || item.status === filters.status;

        // Date Range (Basic String Comparison for YYYY-MM-DD)
        const matchesStart =
          !filters.startDate || item.date >= filters.startDate;
        const matchesEnd = !filters.endDate || item.date <= filters.endDate;

        // Month and Year Filters
        const saleDate = new Date(item.date);
        const matchesMonth =
          filters.month === "All" ||
          (saleDate.getMonth() + 1).toString() === filters.month;
        const matchesYear =
          filters.year === "All" ||
          saleDate.getFullYear().toString() === filters.year;

        return (
          matchesSearch &&
          matchesMode &&
          matchesStatus &&
          matchesStart &&
          matchesEnd &&
          matchesMonth &&
          matchesYear
        );
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "Oldest":
            return (
              new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
            );
          case "Highest":
            return b.amount - a.amount;
          case "Lowest":
            return a.amount - b.amount;
          case "Newest":
          default:
            return (
              new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`)
            );
        }
      });
  }, [filters, mappedSales]);

  // Paginated Data
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  if (billingLoading && sales.length === 0) {
    return <Loader message="Loading sale history..." />;
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* <div>
          <h2 className="fw-bold mb-1 text-dark">Sale History</h2>
          <p className="text-muted small mb-0">
            View and manage past transactions
          </p>
        </div> */}
      </div>

      <SaleHistoryStats data={filteredData} />

      <SaleHistoryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onExport={handleExport}
        availableYears={availableYears}
      />

      <SaleHistoryTable
        data={paginatedData}
        onViewSale={handleViewSale}
        onRefundSale={handleOpenRefund}
        currencySymbol={currencySymbol}
      />

      <SaleHistoryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredData.length}
        pageSize={pageSize}
      />

      <SaleHistoryDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sale={selectedSale}
        currencySymbol={currencySymbol}
        onOpenRefund={() => {
          setIsModalOpen(false);
          setIsRefundModalOpen(true);
        }}
      />

      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        sale={selectedSale}
        onRefund={handleProcessRefund}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};

export default SaleHistory;
