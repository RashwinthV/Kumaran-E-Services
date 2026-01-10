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
  });

  const [filters, setFilters] = useState({
    type: "sales", // Always default to sales report
    dateRange: "this_month",
    branch: "all",
    startDate: "",
    endDate: "",
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
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
          setData(cachedData);
          applyFilters(cachedData, filters);
          setLoading(false);
          return;
        }
      }

      // Fetch sales data for both Sales Report and Branch Performance
      if (filters.type === "sales" || filters.type === "branch-performance") {
        const response = await axios.get(`${baseURL}/sales`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.data.success) {
          const rawData = response.data.data.map((item) => {
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
              status: item.status === "Completed" ? "Paid" : item.status,
              items: item.items || [],
              cgstTotal: item.totalTax
                ? Number((item.totalTax / 2).toFixed(2))
                : 0,
              sgstTotal: item.totalTax
                ? Number((item.totalTax - item.totalTax / 2).toFixed(2))
                : 0,
              totalTax: item.totalTax || 0,
            };
          });
          setData(rawData);
          await setCache(cacheKey, rawData, TTL.SHORT);
          applyFilters(rawData, filters);
        }
      }
    } catch (error) {
      console.error("Error fetching report data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      applyFilters(data, filters);
    }
  }, [filters, data]);

  const handleGenerate = () => {
    fetchData(true);
  };

  const applyFilters = (sourceData, currentFilters) => {
    let result = [...sourceData];

    // Branch Filter (using rawBranchId)
    // Only apply for Sales Report, NOT for Branch Performance (which compares all branches)
    if (
      currentFilters.type !== "branch-performance" &&
      currentFilters.branch !== "all"
    ) {
      // Ensure IDs are strictly converted to strings for comparison
      result = result.filter(
        (item) => String(item.rawBranchId) === String(currentFilters.branch)
      );
    }

    // Date Filter Logic
    const todayStart = new Date();
    // Date Filter Logic
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const checkDate = (itemDateStr) => {
      const d = new Date(itemDateStr);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    if (currentFilters.dateRange === "today") {
      result = result.filter(
        (item) => checkDate(item.date).getTime() === today.getTime()
      );
    } else if (currentFilters.dateRange === "yesterday") {
      result = result.filter(
        (item) => checkDate(item.date).getTime() === yesterday.getTime()
      );
    } else if (currentFilters.dateRange === "this_week") {
      const day = today.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      result = result.filter((item) => checkDate(item.date) >= weekStart);
    } else if (currentFilters.dateRange === "last_week") {
      const day = today.getDay();
      const diffToLastMonday = (day === 0 ? -6 : 1) - day - 7;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + diffToLastMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      result = result.filter((item) => {
        const d = checkDate(item.date);
        return d >= weekStart && d <= weekEnd;
      });
    } else if (currentFilters.dateRange === "this_month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter((item) => checkDate(item.date) >= monthStart);
    } else if (currentFilters.dateRange === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      result = result.filter((item) => {
        const d = checkDate(item.date);
        return d >= start && d <= end;
      });
    } else if (currentFilters.dateRange === "custom") {
      if (currentFilters.startDate && currentFilters.endDate) {
        const start = new Date(currentFilters.startDate);
        const end = new Date(currentFilters.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        result = result.filter((item) => {
          const d = checkDate(item.date);
          return d >= start && d <= end;
        });
      } else {
        result = [];
      }
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

    // Stats calc needs full sales list for totals, even if view is grouped
    // But for Branch perf view, stats should reflect total sales of all branches in view
    if (currentFilters.type === "branch-performance") {
      const totalSales = result.reduce((acc, b) => acc + b.totalSales, 0);
      const totalBills = result.reduce((acc, b) => acc + b.totalBills, 0);
      setStats({
        totalSales,
        totalBills,
        totalCustomers: 0, // Hard to count unique across branches aggregated
      });
    } else {
      calculateStats(result);
    }
  };

  const calculateStats = (dataSet) => {
    // Stats calculation based on unique bills to avoid double counting items
    const uniqueSales = Array.from(
      new Map(
        dataSet.map((item) => [item._id || item.billNumber, item])
      ).values()
    );
    const totalSales = uniqueSales.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const uniqueCustomers = new Set(uniqueSales.map((i) => i.customerName))
      .size;
    setStats({
      totalSales,
      totalBills: uniqueSales.length,
      totalCustomers: uniqueCustomers,
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
        { header: "Branch", key: "branch", width: 20 },
        { header: "Customer", key: "customerName", width: 20 },
        { header: "Phone", key: "customerPhone", width: 15 },
        { header: "Product Code", key: "sku", width: 15 },
        { header: "Product Name", key: "name", width: 30 },
        { header: "Qty", key: "qty", width: 10 },
        { header: "Rate", key: "price", width: 15 },
        { header: "Taxable Value", key: "taxableValue", width: 15 },
        { header: "CGST", key: "cgst", width: 12 },
        { header: "SGST", key: "sgst", width: 12 },
        { header: "Line Total", key: "lineTotal", width: 18 },
        { header: "Mode", key: "paymentMode", width: 15 },
        { header: "Status", key: "status", width: 12 },
        { header: "cp", key: "cp", width: 12 },
      ];
      worksheet.columns = columns.map((c) => ({ key: c.key, width: c.width }));

      const addTableSection = (title, rowData) => {
        if (rowData.length === 0) return;

        // Section Title
        const sTitleRow = worksheet.addRow([title]);
        sTitleRow.font = { bold: true, size: 16, color: { argb: "FF1F4E78" } };
        worksheet.mergeCells(`A${sTitleRow.number}:O${sTitleRow.number}`);
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

        // Data Rows
        rowData.forEach((row) => {
          const excelRow = worksheet.addRow(row);
          excelRow.font = { size: 13 };
          // Currency formatting for Rate(9), Taxable(10), CGST(11), SGST(12), Total(13)
          [9, 10, 11, 12, 13].forEach((colIndex) => {
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
        worksheet.addRow([]);
        worksheet.addRow([]);
      };

      const inclusiveRows = [];
      const exclusiveRows = [];
      const nonGstRows = [];

      displayData.forEach((sale) => {
        (sale.items || []).forEach((p) => {
          const rowData = [
            sale.billNumber,
            sale.formattedDate,
            sale.branchName,
            sale.customerName,
            sale.customerPhone,
            p.product?.sku || p.sku || "N/A",
            p.product?.name || p.name || "N/A",
            p.qty,
            p.price,
            p.taxableValue || p.lineTotal - p.taxAmount,
            p.taxAmount / 2,
            p.taxAmount - p.taxAmount / 2,
            p.lineTotal,
            sale.paymentMethod,
            sale.status,
          ];
          const gstType = p.product?.gstType || p.gstType;
          if (gstType === "Included") inclusiveRows.push(rowData);
          else if (gstType === "NotIncluded") exclusiveRows.push(rowData);
          else nonGstRows.push(rowData);
        });
      });

      addTableSection("=== GST INCLUSIVE SALES ===", inclusiveRows);
      addTableSection("=== GST EXCLUSIVE SALES ===", exclusiveRows);
      addTableSection("=== NON-GST / EXEMPT SALES ===", nonGstRows);
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
      `Admin_Sales_Export_${new Date().toISOString().split("T")[0]}.xlsx`
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
