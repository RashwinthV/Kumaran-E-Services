import { useState, useEffect } from "react";
import "../../Styles/Products.css";
import { useProduct } from "../../Context/ProductContext";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getDecrypted } from "../../utils/storage";

const ProductsCatalog = () => {
  const { products, loading, getProducts, getCategories, categories } =
    useProduct();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterStock, setFilterStock] = useState("All");
  const [sortBy, setSortBy] = useState("Lowest Stock");
  const [branchInfo, setBranchInfo] = useState(() => getDecrypted("branch"));
  const [appSettings, setAppSettings] = useState(() =>
    getDecrypted("app_settings"),
  );

  const isServiceProduct = (item) => {
    if (!item || !item.product) return false;
    const product = item.product;
    const catName = (product.category?.name || "").toLowerCase();
    const productName = (product.name || "").toLowerCase();

    const serviceKeywords = [
      "xerox",
      "scan",
      "photography",
      "photograph",
      "internet",
      "printing",
      "typing",
      "online",
      "others",
      "other",
      "services",
      "service",
    ];

    return (
      serviceKeywords.some((key) => catName.includes(key)) ||
      serviceKeywords.some((key) => productName.includes(key))
    );
  };

  useEffect(() => {
    getProducts();
    getCategories();
  }, [getProducts, getCategories]);
  if (!products) return;
  const uniqueCategories = ["All", ...categories.map((c) => c.name)];

  const filteredProducts = products
    .filter((item) => {
      const product = item.product;


      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term || // If search is empty, match all
        (product.name && product.name.toLowerCase().includes(term)) ||
        (product.sku && product.sku.toLowerCase().includes(term)) ||
        (product.brand && product.brand.toLowerCase().includes(term)) ||
        (product.model && product.model.toLowerCase().includes(term)) ||
        (product.tags &&
          product.tags.some((tag) => tag.toLowerCase().includes(term))) ||
        (product.compatibleModels &&
          product.compatibleModels.some((model) =>
            model.toLowerCase().includes(term),
          ));

      // Handle nested category name (if populated) or find in categories array
      const categoryName =
        product.category?.name ||
        categories.find((c) => c._id === product.category)?.name ||
        "Uncategorized";

      const matchesCategory =
        filterCategory === "All" || categoryName === filterCategory;

      // Status logic - use product's isActive field
      const status = product.isActive ? "Active" : "Inactive";
      const matchesStatus = filterStatus === "All" || status === filterStatus;

      // Stock Level Filter
      const threshold = item.lowStockThreshold || 0;
      const isLowStock = item.quantity > 0 && item.quantity <= threshold;
      const isOutOfStock = item.quantity <= 0;
      let matchesStock = true;
      if (filterStock === "Low Stock") matchesStock = isLowStock;
      else if (filterStock === "Out of Stock") matchesStock = isOutOfStock;
      else if (filterStock === "In Stock")
        matchesStock = !isLowStock && !isOutOfStock;

      const passes =
        matchesSearch && matchesCategory && matchesStatus && matchesStock;

      return passes;
    })
    .sort((a, b) => {
      if (sortBy === "Lowest Stock") {
        return (a.quantity || 0) - (b.quantity || 0);
      } else if (sortBy === "Highest Stock") {
        return (b.quantity || 0) - (a.quantity || 0);
      } else if (sortBy === "Newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });



  const getStockStatus = (item) => {
    if (isServiceProduct(item))
      return { label: "Service", class: "service-badge" };
    const quantity = item.quantity || 0;
    const threshold = item.lowStockThreshold || 0;
    if (quantity <= 0) return { label: "Out of Stock", class: "out-of-stock" };
    if (quantity <= threshold)
      return { label: "Low Stock", class: "low-stock" };
    return { label: "In Stock", class: "in-stock" };
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const branchName = branchInfo?.name || "Branch";
    const worksheet = workbook.addWorksheet(`Stock Report - ${branchName}`);

    const columns = [
      { header: "S.No", key: "sno", width: 8 },
      { header: "Product Name", key: "name", width: 35 },
      { header: "SKU", key: "sku", width: 15 },
      { header: "Category", key: "category", width: 20 },
      { header: "Stock Quantity", key: "quantity", width: 15 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Final Price", key: "finalPrice", width: 15 },
      { header: "MRP", key: "mrp", width: 15 },
      { header: "Total Value", key: "totalValue", width: 20 },
      { header: "Status", key: "status", width: 18 },
    ];
    worksheet.columns = columns.map((c) => ({ key: c.key, width: c.width }));

    // 1. Branch Header (Matching Image: Green border box)
    const bNameRow = worksheet.addRow([branchName.toUpperCase()]);
    bNameRow.font = { bold: true, size: 16 };
    bNameRow.height = 30;
    worksheet.mergeCells(bNameRow.number, 1, bNameRow.number, columns.length);
    bNameRow.alignment = { horizontal: "center", vertical: "middle" };
    bNameRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF00B050" } },
        left: { style: "thin", color: { argb: "FF00B050" } },
        bottom: { style: "thin", color: { argb: "FF00B050" } },
        right: { style: "thin", color: { argb: "FF00B050" } },
      };
    });

    const contactStr = `Contact: ${
      branchInfo?.contact?.phone || branchInfo?.contact || "N/A"
    }`;
    const bContactRow = worksheet.addRow([contactStr]);
    bContactRow.font = { size: 10 };
    worksheet.mergeCells(
      bContactRow.number,
      1,
      bContactRow.number,
      columns.length,
    );
    bContactRow.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.addRow([]); // Spacer

    // Grouping Logic
    const groups = {
      "Out of Stock": [],
      "Low Stock": [],
      "In Stock": [],
      Service: [],
    };

    filteredProducts.forEach((item) => {
      const stockStatus = getStockStatus(item);
      if (groups[stockStatus.label]) groups[stockStatus.label].push(item);
    });

    const statusConfig = {
      "Out of Stock": { bg: "FFFEE2E2", text: "FF991B1B" },
      "Low Stock": { bg: "FFFFF3C7", text: "FF92400E" },
      "In Stock": { bg: "FFD1FAE5", text: "FF065F46" },
      Service: { bg: "FFF5F3FF", text: "FF5B21B6" },
    };

    let globalSno = 1;
    let totalStockValue = 0;

    // 2. Iterate through groups
    Object.entries(groups).forEach(([statusName, items]) => {
      if (items.length === 0) return;

      // Section Title Row
      const sectionHeader = worksheet.addRow([
        `=== ${statusName.toUpperCase()} ITEMS ===`,
      ]);
      worksheet.mergeCells(
        sectionHeader.number,
        1,
        sectionHeader.number,
        columns.length,
      );
      sectionHeader.font = {
        bold: true,
        size: 12,
        color: { argb: statusConfig[statusName].text },
      };
      sectionHeader.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.addRow([]); // Spacer before table

      // Table Header
      const headerRow = worksheet.addRow(columns.map((c) => c.header));
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F81BD" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Data Rows
      items.forEach((item) => {
        const product = item.product || {};
        const isService = statusName === "Service";
        const qty = isService ? 0 : item.quantity || 0;
        const price = item.FinalPrice || 0;
        const rowTotal = qty * price;
        totalStockValue += rowTotal;

        const row = worksheet.addRow({
          sno: globalSno++,
          name: product.name,
          sku: product.sku,
          category: product.category?.name || "General",
          quantity: isService ? "N/A" : qty,
          unit: product.unit,
          finalPrice: price,
          mrp: product.mrp || 0,
          totalValue: rowTotal,
          status: statusName,
        });

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle" };

          if (columns[colNumber - 1].key === "status") {
            cell.font = {
              color: { argb: statusConfig[statusName].text },
              bold: true,
            };
          }
        });
      });

      worksheet.addRow([]); // Spacer
      worksheet.addRow([]); // Large Spacer
    });

    // 3. Grand Totals
    const summaryRow = worksheet.addRow({
      name: "GRAND TOTAL STOCK VALUE",
      totalValue: totalStockValue,
    });
    summaryRow.font = { bold: true, size: 12 };
    summaryRow.height = 25;
    worksheet.mergeCells(`B${summaryRow.number}:H${summaryRow.number}`);
    summaryRow.getCell("name").alignment = {
      horizontal: "right",
      vertical: "middle",
    };

    summaryRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
      cell.border = {
        top: { style: "medium" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" },
      };
    });

    ["finalPrice", "mrp", "totalValue"].forEach((key) => {
      worksheet.getColumn(key).numFmt = "₹#,##0.00";
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `Stock_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <div className="products-container">
      <div className="products-header">
        <div className="header-left">
          <h1>Products Catalog</h1>
          <p className="products-count">
            {filteredProducts.length} products found
          </p>
        </div>
      </div>

      <div className="products-filters">
        <div className="search-box">
          <label className="filter-label">Search:</label>
          <div className="search-input-wrapper">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Stock Level:</label>
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
          >
            <option value="All">All Levels</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="Lowest Stock">Lowest Stock</option>
            <option value="Highest Stock">Highest Stock</option>
            <option value="Newest">Newest Added</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="filter-actions">
          <button
            className="reset-filters-btn"
            onClick={() => {
              setSearchTerm("");
              setFilterCategory("All");
              setFilterStatus("All");
              setFilterStock("All");
              setSortBy("Lowest Stock");
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
            >
              <path
                d="M4 4V9H4.58152M19.9381 11C19.446 7.05361 16.0796 4 12 4C8.65685 4 5.82083 6.01509 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.1792 17.9849 15.3432 20 12 20C7.92038 20 4.55399 16.9464 4.06189 13M19.4185 15H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Reset Filters
          </button>

          <button className="export-excel-btn" onClick={exportToExcel}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
            >
              <path
                d="M4 12V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V12M12 3V15M12 15L8 11M12 15L16 11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Export Stock Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading products...</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((item) => {
            const product = item.product;
            const stockStatus = getStockStatus(item);

            return (
              <div key={item._id} className="product-card">
                <div className="product-info">
                  <div className="product-header">
                    <h3>{product.name}</h3>
                    <span
                      className={`status-badge ${
                        product.isActive ? "active" : "inactive"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="product-meta">
                    {/* Placeholder for future SKU/Brand info if needed */}
                  </div>

                  <div className="compatible-section">
                    {product.compatibleModels &&
                      product.compatibleModels.length > 0 && (
                        <p className="compatible-label">Compatible With:</p>
                      )}{" "}
                    <div className="compatible-tags">
                      {
                        product.compatibleModels &&
                        product.compatibleModels.length > 0
                          ? product.compatibleModels.map((model, idx) => (
                              <span key={idx} className="model-tag">
                                {model}
                              </span>
                            ))
                          : ""
                        // <span className="model-tag" style={{ opacity: 0.5 }}>
                        //   No compatible models listed
                        // </span>
                      }
                    </div>
                  </div>

                  <div className="product-stock">
                    <div className="stock-info-row">
                      {!isServiceProduct(item) && (
                        <span className="stock-quantity">
                          Stock: <strong>{item.quantity}</strong> {product.unit}
                        </span>
                      )}
                      <span className={`stock-badge ${stockStatus.class}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>

                  <div className="pricing-section">
                    <div className="price-row">
                      <p className="current-price">₹{item.FinalPrice}</p>
                      {product.mrp > item.FinalPrice && (
                        <p className="mrp-strike">₹{product.mrp}</p>
                      )}
                    </div>
                    <div className="mrp-row">
                      <span>MRP: ₹{product.mrp}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="no-products">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3>No products found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default ProductsCatalog;
