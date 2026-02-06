import { useState, useEffect, useMemo } from "react";
import ReportFilters from "../Components/Reports/ReportFilters";
import ReportStats from "../Components/Reports/ReportStats";
import ReportTable from "../Components/Reports/ReportTable";
import "../Styles/Reports.css";
import axios from "axios";
import { useBranch } from "../Context/BranchContext";
import { useAuth } from "../Context/AuthContext";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { setCache, getCache, CACHE_KEYS, TTL } from "../utils/cacheUtils";

const formatDateStr = (dateStr, format) => {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [y, m, d] = dateStr.split("-");
  if (format === "DD/MM/YYYY") return `${d}/${m}/${y}`;
  if (format === "MM/DD/YYYY") return `${m}/${d}/${y}`;
  return dateStr;
};

const Reports = () => {
  const { branches, getBranches } = useBranch();
  const { accessToken } = useAuth();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalBills: 0,
    totalCustomers: 0,
    totalRefunds: 0,
  });
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [filters, setFilters] = useState({
    type: "sales", // Always default to sales report
    dateRange: "this_month",
    branch: "all",
    startDate: "",
    endDate: "",
    billType: "all",
  });

  const baseURL = `${import.meta.env.VITE_BACKEND_BASE_URI}/admin`;

  useEffect(() => {
    fetchData(); // Load data on mount
    getBranches();
  }, [accessToken]); // Add accessToken dependency to retry fetch when token is available

  const fetchData = async (forceRefresh = false) => {
    if (!accessToken) return;

    const cacheKey = "/cache/api/reports_sales";

    try {
      setLoading(true);

      if (!forceRefresh) {
        const cached = await getCache(cacheKey);
        if (cached && cached.sales) {
          setData(cached.sales);
          setRefunds(cached.refunds || []);
          setExpenses(cached.expenses || []);
          applyFilters(
            cached.sales,
            filters,
            cached.refunds || [],
            cached.expenses || [],
          );
          setLoading(false);
          return;
        }
      }

      // Fetch sales data
      if (filters.type === "sales" || filters.type === "branch-performance") {
        const [salesRes, expenseRes] = await Promise.all([
          axios.get(`${baseURL}/sales`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${baseURL}/expenses`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        if (salesRes.data.success) {
          const rawData = salesRes.data.data.map((item) => {
            const createdDate = new Date(item.createdAt);
            const dateStr =
              item.dateStr || createdDate.toISOString().split("T")[0];

            return {
              id: item._id,
              date: dateStr,
              time: createdDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              billNumber: item.billNumber,
              rawBranchId: item.branchId,
              customerName: item.customer?.name || "Walk-in",
              customerPhone: item.customer?.phone || "N/A",
              paymentMethod:
                item.paymentMethod?.type +
                (item.paymentMethod?.upiAccountName
                  ? ` (${item.paymentMethod.upiAccountName})`
                  : ""),
              amount: item.grandTotal,
              totalRefundedAmount: item.totalRefundedAmount || 0,
              status: item.status === "Completed" ? "Paid" : item.status,
              items: (item.items || []).map((p) => ({
                ...p,
                costPrice: p.costPrice || 0,
                resolvedCP: p.costPrice || 0,
              })),
              cgstTotal: item.totalTax
                ? Number((item.totalTax / 2).toFixed(2))
                : 0,
              sgstTotal: item.totalTax
                ? Number((item.totalTax - item.totalTax / 2).toFixed(2))
                : 0,
              totalTax: item.totalTax || 0,
              fieldService: item.fieldService || "",
              isService: item.isService,
              totalCP: item.totalCP || 0,
              totalProfit: item.totalProfit || 0,
              gstBillNo: item.gstBillNo,
            };
          });

          const rawExpenses = expenseRes.data.success
            ? expenseRes.data.data
            : [];

          setData(rawData);
          const refundData = salesRes.data.refunds || [];
          setRefunds(refundData);
          setExpenses(rawExpenses);

          await setCache(
            cacheKey,
            { sales: rawData, refunds: refundData, expenses: rawExpenses },
            TTL.SHORT,
          );
          applyFilters(rawData, filters, refundData, rawExpenses);
        }
      }
    } catch (error) {
      console.error("Error fetching report data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data.length > 0 || expenses.length > 0) {
      applyFilters(data, filters, refunds, expenses);
    }
  }, [filters, data, refunds, expenses]);

  const handleGenerate = () => {
    fetchData(true);
  };

  const applyFilters = (
    sourceData,
    currentFilters,
    sourceRefunds = [],
    sourceExpenses = [],
  ) => {
    let result = [...sourceData];
    let expenseResult = [...sourceExpenses];

    // Branch Filter
    if (
      currentFilters.type !== "branch-performance" &&
      currentFilters.branch !== "all"
    ) {
      // Ensure IDs are strictly converted to strings for comparison
      result = result.filter(
        (item) => String(item.rawBranchId) === String(currentFilters.branch),
      );
      expenseResult = expenseResult.filter(
        (exp) => String(exp.branch) === String(currentFilters.branch),
      );
    }

    // Date Filter Logic
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const checkDate = (itemDateStr) => {
      const d = new Date(itemDateStr);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    const filterByDate = (dateVal) => {
      const itemDate = checkDate(dateVal);

      if (currentFilters.dateRange === "today") {
        return itemDate.getTime() === today.getTime();
      } else if (currentFilters.dateRange === "yesterday") {
        return itemDate.getTime() === yesterday.getTime();
      } else if (currentFilters.dateRange === "this_week") {
        const day = today.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);
        return itemDate >= weekStart;
      } else if (currentFilters.dateRange === "last_week") {
        const day = today.getDay();
        const diffToLastMonday = (day === 0 ? -6 : 1) - day - 7;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + diffToLastMonday);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return itemDate >= weekStart && itemDate <= weekEnd;
      } else if (currentFilters.dateRange === "this_month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return itemDate >= monthStart;
      } else if (currentFilters.dateRange === "last_month") {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return itemDate >= start && itemDate <= end;
      } else if (currentFilters.dateRange === "custom") {
        if (currentFilters.startDate && currentFilters.endDate) {
          const start = new Date(currentFilters.startDate);
          const end = new Date(currentFilters.endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }
        return false;
      }
      return true;
    };

    result = result.filter((item) => filterByDate(item.date));
    expenseResult = expenseResult.filter((exp) => filterByDate(exp.date));

    // Bill Type Filter
    if (currentFilters.billType !== "all") {
      result = result.filter((item) => {
        if (currentFilters.billType === "services") return item.isService;
        if (currentFilters.billType === "products") return !item.isService;
        return true;
      });
    }

    // If Branch Performance, Aggregate Data by Branch
    if (currentFilters.type === "branch-performance") {
      const branchGroups = {};

      result.forEach((sale) => {
        const bId = sale.rawBranchId;
        if (!branchGroups[bId]) {
          branchGroups[bId] = {
            rawBranchId: bId, // Keep for mapping name later
            totalSales: 0,
            totalBills: 0,
            billNumbers: [], // Optional
          };
        }
        branchGroups[bId].totalSales += sale.amount || 0;
        branchGroups[bId].totalBills += 1;
      });

      // Convert back to array
      result = Object.values(branchGroups);
    }

    setFilteredData(result);
    setFilteredExpenses(expenseResult);

    // Stats calc needs full sales list for totals, even if view is grouped
    // But for Branch perf view, stats should reflect total sales of all branches in view
    // Stats calc
    if (currentFilters.type === "branch-performance") {
      const totalSales = result.reduce((acc, b) => acc + b.totalSales, 0);
      const totalBills = result.reduce((acc, b) => acc + b.totalBills, 0);
      setStats({
        totalSales,
        totalBills,
        totalCustomers: 0,
        totalRefunds: 0, // Not calculated for branch perf yet
      });
    } else {
      calculateStats(result);
    }
  };

  const calculateStats = (dataSet) => {
    // Stats calculation based on unique bills to avoid double counting items
    const uniqueSales = Array.from(
      new Map(
        dataSet.map((item) => [item._id || item.billNumber, item]),
      ).values(),
    );
    const totalSales = uniqueSales.reduce(
      (sum, item) => sum + (item.amount || 0),
      0,
    );
    const totalRefunded = uniqueSales.reduce((sum, item) => {
      // If paymentMode is Credits, it's not a financial refund (no cash out)
      if (item.paymentMode === "Credits") return sum;
      return sum + (item.totalRefundedAmount || 0);
    }, 0);
    const uniqueCustomers = new Set(uniqueSales.map((i) => i.customerName))
      .size;
    setStats({
      totalSales: totalSales - totalRefunded,
      totalBills: uniqueSales.length,
      totalCustomers: uniqueCustomers,
      totalRefunds: totalRefunded,
    });
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Map branch names for display
  const displayData = useMemo(() => {
    return filteredData.map((item) => ({
      ...item,
      branchName:
        branches.find((b) => b._id === item.rawBranchId)?.name ||
        "Unknown Branch",
      formattedDate: formatDateStr(item.date, "DD/MM/YYYY"), // Default admin format
    }));
  }, [filteredData, branches]);

  const handleExport = async () => {
    if (displayData.length === 0) {
      return alert("No data to export");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Admin Sales Report");

    // Add Main Title
    const titleRow = worksheet.addRow(["KES ADMIN CONSOLE - SALES REPORT"]);
    titleRow.font = { bold: true, size: 18 };
    worksheet.mergeCells(`A${titleRow.number}:O${titleRow.number}`);
    titleRow.alignment = { horizontal: "center" };
    worksheet.addRow([]); // Spacer

    if (filters.type === "sales") {
      // Define Columns (15 columns for Admin with Branch)
      const columns = [
        { header: "Bill Number", key: "billNo", width: 25 },
        { header: "Date", key: "date", width: 15 },
        { header: "Customer", key: "customerName", width: 20 },
        { header: "Phone", key: "customerPhone", width: 15 },
        { header: "Product Code", key: "sku", width: 15 },
        { header: "Product Name", key: "name", width: 30 },
        { header: "IMEI", key: "imei", width: 25 },
        { header: "Qty", key: "qty", width: 10 },
        { header: "Rate", key: "price", width: 20 },
        { header: "Taxable Value", key: "taxableValue", width: 40 },
        { header: "CGST", key: "cgst", width: 18 },
        { header: "SGST", key: "sgst", width: 18 },
        { header: "CP", key: "cp", width: 18 },
        { header: "Line Total", key: "lineTotal", width: 22 },
        { header: "Mode", key: "paymentMode", width: 15 },
        { header: "Status", key: "status", width: 18 },
        { header: "Branch", key: "branch", width: 20 },
        { header: "Field Service", key: "fieldService", width: 20 },
      ];
      worksheet.columns = columns.map((c) => ({ key: c.key, width: c.width }));

      const addTableSection = (title, rowData) => {
        if (rowData.length === 0) return;

        // Section Title
        const sTitleRow = worksheet.addRow([title]);
        sTitleRow.font = { bold: true, size: 16, color: { argb: "FF1F4E78" } };
        worksheet.mergeCells(`A${sTitleRow.number}:R${sTitleRow.number}`);
        sTitleRow.alignment = { horizontal: "center" };
        worksheet.addRow([]); // Spacer

        // Column Headers
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

        let totalCP = 0;
        let totalTax = 0;
        let grandTotal = 0;

        // Data Rows
        rowData.forEach((row) => {
          const excelRow = worksheet.addRow(row);
          excelRow.font = { size: 13 };

          // Summing totals (Indices for row array: CGST=10, SGST=11, CP=12, Total=13)
          totalTax += (row[10] || 0) + (row[11] || 0);
          totalCP += row[12] || 0;
          grandTotal += row[13] || 0;

          // Currency formatting for Rate(9), Taxable(10), CGST(11), SGST(12), CP(13), Total(14)
          [9, 10, 11, 12, 13, 14].forEach((colIndex) => {
            const cell = excelRow.getCell(colIndex);
            cell.numFmt = `"₹"#,##0.00`;
          });
          excelRow.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });

        // Add Summary Totals Row (Properly Aligned)
        const totalsRowData = new Array(14).fill("");
        totalsRowData[8] = "SECTION TOTALS:";
        // totalTax at index 11 (SGST column), totalCP at index 12 (CP column), grandTotal at index 13 (Line Total column)
        totalsRowData[11] = totalTax;
        totalsRowData[12] = totalCP;
        totalsRowData[13] = grandTotal;

        const summaryRow = worksheet.addRow(totalsRowData);
        summaryRow.font = { bold: true, size: 14 };

        // Formatting summary cells (Excel columns are 1-indexed, so add 1 to array indices)
        // Col 12=SGST, 13=CP, 14=LineTotal
        [12, 13, 14].forEach((col) => {
          const cell = summaryRow.getCell(col);
          cell.numFmt = `"₹"#,##0.00`;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE9ECEF" }, // Light grey
          };
          cell.border = {
            top: { style: "medium" },
            left: { style: "thin" },
            bottom: { style: "medium" },
            right: { style: "thin" },
          };
        });

        // Label alignment
        summaryRow.getCell(9).alignment = { horizontal: "right" };

        worksheet.addRow([]);
        worksheet.addRow([]);
      };

      const inclusiveRows = [];
      const exclusiveRows = [];
      const nonGstRows = [];
      const serviceRows = [];

      displayData.forEach((sale) => {
        (sale.items || []).forEach((p) => {
          // Determine item-level status
          let itemStatus = sale.status;
          if (p.refundedQty >= p.qty) {
            itemStatus = "Refunded";
          } else if (p.refundedQty > 0) {
            itemStatus = "Partially Refunded";
          } else if (["Refunded", "Partially Refunded"].includes(sale.status)) {
            // Item is untouched but bill has refunds
            itemStatus = "Paid";
          }

          const cpValue = (p.costPrice || 0) * (p.qty || 0);

          const rowData = [
            sale.billNumber,
            sale.formattedDate,
            sale.customerName,
            sale.customerPhone,
            p.product?.sku || p.sku || (sale.isService ? "Service" : "N/A"),
            p.name || p.product?.name || "N/A",
            p.imei || p.details?.consumerId || p.details?.imei || "",
            p.qty,
            p.price,
            p.taxableValue || p.lineTotal - p.taxAmount,
            p.taxAmount / 2,
            p.taxAmount - p.taxAmount / 2,
            cpValue,
            p.lineTotal,
            sale.paymentMethod,
            itemStatus,
            sale.branchName,
            sale.fieldService || "",
          ];

          if (sale.isService) {
            serviceRows.push(rowData);
          } else {
            const gstType = p.product?.gstType || p.gstType;
            if (gstType === "Included") inclusiveRows.push(rowData);
            else if (gstType === "NotIncluded") exclusiveRows.push(rowData);
            else nonGstRows.push(rowData);
          }
        });
      });

      addTableSection("=== GST INCLUSIVE SALES ===", inclusiveRows);
      addTableSection("=== GST EXCLUSIVE SALES ===", exclusiveRows);
      addTableSection("=== NON-GST / EXEMPT SALES ===", nonGstRows);
      addTableSection("=== SERVICE SALES ===", serviceRows);

      // === PROFIT & LOSS TABLE (Unified Style) ===

      // 1. Calculations (Keep existing logic)
      let revProductList = 0;
      let revServiceList = 0;
      let totCOGS = 0;

      displayData.forEach((sale) => {
        const saleTotal = sale.amount || 0;
        if (sale.isService) {
          revServiceList += saleTotal;
        } else {
          revProductList += saleTotal;
        }
        totCOGS += sale.totalCP || 0;
      });

      const totalRevenue = revProductList + revServiceList;
      const grossProfit = totalRevenue - totCOGS;
      const grossMargin =
        totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      let expEmployee = 0;
      let expRent = 0;
      let expOther = 0;
      let expProductOverhead = 0;

      filteredExpenses.forEach((exp) => {
        const cat = (exp.category || "").toLowerCase();
        if (cat === "employee") expEmployee += exp.amount;
        else if (cat === "rent") expRent += exp.amount;
        else if (cat === "product") expProductOverhead += exp.amount;
        else expOther += exp.amount;
      });

      const totalOperatingExpenses =
        expEmployee + expRent + expProductOverhead + expOther;
      const netProfit = grossProfit - totalOperatingExpenses;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // 2. Build Table Data
      const profitTableRows = [
        // Revenue
        [
          "Sales Revenue (Products)",
          "Income",
          revProductList,
          (totalRevenue > 0
            ? (revProductList / totalRevenue) * 100
            : 0
          ).toFixed(1) + "%",
        ],
        [
          "Service Revenue",
          "Income",
          revServiceList,
          (totalRevenue > 0
            ? (revServiceList / totalRevenue) * 100
            : 0
          ).toFixed(1) + "%",
        ],
        ["TOTAL REVENUE", "Total Income", totalRevenue, "100.0%"],
        // COGS
        [
          "Cost of Goods Sold",
          "COGS",
          totCOGS,
          (totalRevenue > 0 ? (totCOGS / totalRevenue) * 100 : 0).toFixed(1) +
            "%",
        ],
        // Gross Profit
        ["GROSS PROFIT", "Profit", grossProfit, grossMargin.toFixed(1) + "%"],
        // Expenses
        [
          "Employee Salaries",
          "Expense",
          expEmployee,
          (totalRevenue > 0 ? (expEmployee / totalRevenue) * 100 : 0).toFixed(
            1,
          ) + "%",
        ],
        [
          "Rent / Infrastructure",
          "Expense",
          expRent,
          (totalRevenue > 0 ? (expRent / totalRevenue) * 100 : 0).toFixed(1) +
            "%",
        ],
        [
          "Product Overhead",
          "Expense",
          expProductOverhead,
          (totalRevenue > 0
            ? (expProductOverhead / totalRevenue) * 100
            : 0
          ).toFixed(1) + "%",
        ],
        [
          "Other Expenses",
          "Expense",
          expOther,
          (totalRevenue > 0 ? (expOther / totalRevenue) * 100 : 0).toFixed(1) +
            "%",
        ],
        [
          "TOTAL OPERATING EXPENSES",
          "Total Expense",
          totalOperatingExpenses,
          (totalRevenue > 0
            ? (totalOperatingExpenses / totalRevenue) * 100
            : 0
          ).toFixed(1) + "%",
        ],
        // Net Profit
        [
          "NET PROFIT / LOSS",
          "Net Income",
          netProfit,
          netMargin.toFixed(1) + "%",
        ],
      ];

      worksheet.addRow([]);

      // Section Title
      const plTitleRow = worksheet.addRow(["PROFIT & LOSS STATEMENT"]);
      plTitleRow.font = { bold: true, size: 16, color: { argb: "FF1F4E78" } };
      worksheet.mergeCells(`A${plTitleRow.number}:D${plTitleRow.number}`);
      plTitleRow.alignment = { horizontal: "center" };
      worksheet.addRow([]);

      // Headers
      const plHeaders = ["Description", "Category", "Amount", "% of Revenue"];
      const plHeaderRow = worksheet.addRow(plHeaders);
      plHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };

      plHeaderRow.eachCell((cell, colNumber) => {
        if (colNumber <= 4) {
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
        }
      });

      // Rows
      profitTableRows.forEach((row) => {
        const excelRow = worksheet.addRow(row);
        excelRow.font = { size: 13 };

        // Bold totals lines
        if (
          row[0].startsWith("TOTAL") ||
          row[0].startsWith("GROSS") ||
          row[0].startsWith("NET")
        ) {
          excelRow.font = { bold: true, size: 13 };
          // Optional: Light background for summary lines
          excelRow.eachCell((c, col) => {
            if (col <= 4)
              c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE9E9E9" },
              };
          });
        }

        // Color Net Profit
        if (row[0].startsWith("NET")) {
          const color = row[2] >= 0 ? "FF00B050" : "FFFF0000";
          excelRow.font = { bold: true, size: 14, color: { argb: color } };
        }

        // Currency format col 3
        excelRow.getCell(3).numFmt = `"₹"#,##0.00`;

        excelRow.eachCell((cell, col) => {
          if (col <= 4) {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            if (col === 3 || col === 4)
              cell.alignment = { horizontal: "right" };
          }
        });
      });

      worksheet.addRow([]);

      // === REFUND SECTION ===
      const filteredRefunds = (refunds || []).filter((r) => {
        // Simple branch check for admin view
        if (
          filters.branch !== "all" &&
          String(r.branch) !== String(filters.branch)
        )
          return false;

        const rDate = new Date(r.createdAt).toISOString().split("T")[0];
        // Note: Admin Reports uses its own logic for dateRange, but if it's 'custom', it uses filters.startDate
        if (filters.dateRange === "custom") {
          if (filters.startDate && rDate < filters.startDate) return false;
          if (filters.endDate && rDate > filters.endDate) return false;
        }

        return true;
      });

      if (filteredRefunds.length > 0) {
        const refundRows = filteredRefunds.map((r) => {
          const itemNames = r.items
            .map((i) => i.product?.name || "Product")
            .join(", ");
          const skus = r.items.map((i) => i.product?.sku || "N/A").join(", ");
          const bName =
            branches.find((b) => b._id === r.branch)?.name || "Branch";
          return [
            r.originalSale?.billNumber || r.billNumber || "N/A",
            new Date(r.createdAt).toLocaleDateString(),
            r.customer?.name || "Walk-in",
            r.customer?.phone || "N/A",
            skus,
            itemNames,
            r.items.reduce((acc, i) => acc + i.qty, 0),
            r.totalRefundedAmount,
            r.reason || "N/A",
            r.staff?.name || "Staff",
            bName,
          ];
        });

        const rTitleRow = worksheet.addRow(["=== REFUND TRANSACTIONS ==="]);
        rTitleRow.font = { bold: true, size: 16, color: { argb: "FFFF0000" } };
        worksheet.mergeCells(`A${rTitleRow.number}:K${rTitleRow.number}`);
        rTitleRow.alignment = { horizontal: "center" };
        worksheet.addRow([]);

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
          "Branch",
        ];

        const rHead = worksheet.addRow(refundHeaders);
        rHead.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
        rHead.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFC00000" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        refundRows.forEach((row) => {
          const excelRow = worksheet.addRow(row);
          excelRow.font = { size: 13 };
          // Total Refunded is at column 8
          const totalCell = excelRow.getCell(8);
          totalCell.numFmt = `"₹"#,##0.00`;
          excelRow.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });
      }
    } else {
      // Branch Performance Report
      worksheet.columns = [
        { header: "Branch Name", key: "name", width: 35 },
        { header: "Total Bills", key: "bills", width: 15 },
        { header: "Total Sales", key: "sales", width: 20 },
      ];

      const headerRow = worksheet.addRow([
        "=== BRANCH PERFORMANCE SUMMARY ===",
      ]);
      headerRow.font = { bold: true, size: 14 };
      worksheet.mergeCells(`A${headerRow.number}:C${headerRow.number}`);
      headerRow.alignment = { horizontal: "center" };

      const colHeaderRow = worksheet.addRow([
        "Branch Name",
        "Total Bills",
        "Total Sales",
      ]);
      colHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      colHeaderRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F81BD" },
        };
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      displayData.forEach((row) => {
        const tr = worksheet.addRow([
          row.branchName,
          row.totalBills,
          row.totalSales,
        ]);
        tr.getCell(3).numFmt = `"₹"#,##0.00`;
        tr.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `Admin_Sales_Export_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="reports-title">
          <h1>Reports & Analytics</h1>
          <p>Generate comprehensive reports for your business performance.</p>
        </div>
      </div>

      <ReportFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onGenerate={handleGenerate}
        onExport={handleExport}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          Loading data...
        </div>
      ) : (
        <>
          <ReportStats stats={stats} />
          <ReportTable data={displayData} reportType={filters.type} />
        </>
      )}
    </div>
  );
};

export default Reports;
