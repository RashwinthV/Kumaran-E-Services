import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "../../Styles/Products.css";
import UniversalDelete from "../../Modals/UniversalDelete";
import AddInventoryModal from "../../Modals/Inventory/AddInventoryModal";
import { useBranch } from "../../Context/BranchContext";
import BackButton from "../../Components/BackButton";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const BranchProducts = () => {
  const { id } = useParams();
  const {
    branches,
    getBranches,
    branchInventory,
    getInventory,
    addInventory: addInventoryApi,
    updateInventory,
    deleteInventory,
    loading,
  } = useBranch();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All"); // Active/Inactive
  const [filterStock, setFilterStock] = useState("All"); // Stock Level
  const [sortBy, setSortBy] = useState("Lowest Stock");

  // Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [inventoryToDelete, setInventoryToDelete] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Stock Edit State
  const [editingStockId, setEditingStockId] = useState(null);
  const [newStockValue, setNewStockValue] = useState("");

  useEffect(() => {
    if (branches.length === 0) {
      getBranches();
    }
  }, [branches.length, getBranches]);

  useEffect(() => {
    if (id) {
      getInventory(id);
    }
  }, [id, getInventory]);

  const currentBranch = branches.find((b) => b._id === id);

  // Helper function to determine status
  function getStatus(item) {
    if (!item || !item.product) return "Unknown";

    const catName = (item.product.category?.name || "").toLowerCase();
    const productName = (item.product.name || "").toLowerCase();

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

    const isService =
      serviceKeywords.some((key) => catName.includes(key)) ||
      serviceKeywords.some((key) => productName.includes(key));

    if (isService) return "N/A";

    if (item.quantity === 0) return "Out of Stock";
    if (item.quantity <= item.lowStockThreshold) return "Low Stock";
    return "In Stock";
  }

  // Ensure branchInventory is an array to prevent crashes
  const safeInventory = Array.isArray(branchInventory) ? branchInventory : [];

  // Extract unique categories from loaded inventory
  const categories = [
    "All",
    ...new Set(
      safeInventory.map((item) => item.product?.category?.name || "General"),
    ),
  ];

  const filteredProducts = safeInventory
    .filter((item) => {
      // Inventory item structure: { product: { name, ... }, quantity, ... }
      const product = item.product || {};
      const productName = product.name || "";
      const categoryName = product.category?.name || "General";
      const stockStatus = getStatus(item);

      // Search Logic (Enhanced)
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        productName.toLowerCase().includes(term) ||
        (product.sku && product.sku.toLowerCase().includes(term)) ||
        (product.brand && product.brand.toLowerCase().includes(term)) ||
        (product.model && product.model.toLowerCase().includes(term)) ||
        (product.tags &&
          product.tags.some((tag) => tag.toLowerCase().includes(term))) ||
        (product.compatibleModels &&
          product.compatibleModels.some((model) =>
            model.toLowerCase().includes(term),
          ));

      const matchesCategory =
        filterCategory === "All" || categoryName === filterCategory;

      // Product Status Filter (Active/Inactive)
      // Assuming item.product.isActive exists. If not, fallback to true or check data.
      const prodIsActive =
        product.isActive !== undefined ? product.isActive : true;
      const statusStr = prodIsActive ? "Active" : "Inactive";
      const matchesStatus =
        filterStatus === "All" || statusStr === filterStatus;

      // Stock Level Filter
      const matchesStock = filterStock === "All" || stockStatus === filterStock;

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === "Lowest Stock") {
        return (a.quantity || 0) - (b.quantity || 0);
      } else if (sortBy === "Highest Stock") {
        return (b.quantity || 0) - (a.quantity || 0);
      } else if (sortBy === "Newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      // Default fallback sort (Status priority)
      const statusA = getStatus(a);
      const statusB = getStatus(b);
      const priority = {
        "Out of Stock": 1,
        "Low Stock": 2,
        "In Stock": 3,
        "N/A": 4,
      };
      return (priority[statusA] || 5) - (priority[statusB] || 5);
    });

  const getStockClass = (status) => {
    if (status === "In Stock") return "in-stock";
    if (status === "Low Stock") return "low-stock";
    if (status === "N/A") return "service-badge";
    return "out-of-stock";
  };

  const handleDeleteClick = (inventoryItem) => {
    setInventoryToDelete(inventoryItem);
    setDeleteModalOpen(true);
  };

  const handleEditClick = (inventoryItem) => {
    setEditItem(inventoryItem);
    setAddModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!inventoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteInventory(inventoryToDelete._id, id);
      setDeleteModalOpen(false);
      setInventoryToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddInventory = async (data) => {
    await addInventoryApi(data);
    // Context handles cache refresh
  };

  const handleUpdateInventory = async (itemId, data) => {
    await updateInventory(itemId, data, id);
  };

  const startQuickStockEdit = (item) => {
    setEditingStockId(item._id);
    setNewStockValue(item.quantity);
  };

  const cancelQuickStockEdit = () => {
    setEditingStockId(null);
    setNewStockValue("");
  };

  const saveQuickStockEdit = async (itemId) => {
    if (newStockValue === "" || newStockValue < 0) return;

    try {
      await updateInventory(itemId, { quantity: Number(newStockValue) }, id);
      setEditingStockId(null);
      setNewStockValue("");
    } catch (err) {
      console.error("Failed to update stock", err);
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const branchData = safeInventory[0]?.branch || {};
    const branchName = branchData.name || "Branch";
    const worksheet = workbook.addWorksheet(`Stock Report - ${branchName}`);

    // Set columns for width
    const columns = [
      { header: "S.No", key: "sno", width: 8 },
      { header: "Product Name", key: "name", width: 35 },
      { header: "SKU", key: "sku", width: 15 },
      { header: "Category", key: "category", width: 20 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Cost Price", key: "costPrice", width: 15 },
      { header: "Sale Price", key: "sellingPrice", width: 15 },
      { header: "Final Price", key: "finalPrice", width: 15 },
      { header: "Value (Cost)", key: "totalCost", width: 20 },
      { header: "Value (Sale)", key: "totalSelling", width: 20 },
      { header: "Status", key: "status", width: 18 },
      { header: "IMEI", key: "imei", width: 30 },
    ];
    worksheet.columns = columns.map((c) => ({ key: c.key, width: c.width }));

    // 1. Branch Header (Matching Image: Green border box)
    const bNameRow = worksheet.addRow([branchName.toUpperCase()]);
    bNameRow.font = { bold: true, size: 16 };
    bNameRow.height = 30;
    worksheet.mergeCells(`A${bNameRow.number}:M${bNameRow.number}`);
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
      branchData.contact?.phone || branchData.contact || "N/A"
    }`;
    const bContactRow = worksheet.addRow([contactStr]);
    bContactRow.font = { size: 10 };
    worksheet.mergeCells(`A${bContactRow.number}:M${bContactRow.number}`);
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
      const status = getStatus(item);
      const key = status === "N/A" ? "Service" : status;
      if (groups[key]) groups[key].push(item);
    });

    const statusConfig = {
      "Out of Stock": { bg: "FFFEE2E2", text: "FF991B1B" },
      "Low Stock": { bg: "FFFFF3C7", text: "FF92400E" },
      "In Stock": { bg: "FFD1FAE5", text: "FF065F46" },
      Service: { bg: "FFF5F3FF", text: "FF5B21B6" },
    };

    let globalSno = 1;
    let totalStockValueCost = 0;
    let totalStockValueSelling = 0;

    // 2. Iterate through groups
    Object.entries(groups).forEach(([statusName, items]) => {
      if (items.length === 0) return;

      // Section Title Row (e.g., === IN STOCK ITEMS ===)
      const sectionHeader = worksheet.addRow([
        `=== ${statusName.toUpperCase()} ITEMS ===`,
      ]);
      worksheet.mergeCells(`A${sectionHeader.number}:M${sectionHeader.number}`);
      sectionHeader.font = {
        bold: true,
        size: 12,
        color: { argb: statusConfig[statusName].text },
      };
      sectionHeader.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.addRow([]); // Spacer before table

      // Table Header for this section
      const headerRow = worksheet.addRow(columns.map((c) => c.header));
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F81BD" }, // Matching image Indigo
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
        const cost = item.costPrice || 0;
        const selling = item.FinalPrice || 0;
        const qty = statusName === "Service" ? 0 : item.quantity || 0;
        const rowTotalCost = cost * qty;
        const rowTotalSelling = selling * qty;

        totalStockValueCost += rowTotalCost;
        totalStockValueSelling += rowTotalSelling;

        const row = worksheet.addRow({
          sno: globalSno++,
          name: product.name,
          sku: product.sku,
          category: product.category?.name || "General",
          quantity: statusName === "Service" ? "N/A" : qty,
          unit: product.unit,
          costPrice: cost,
          sellingPrice: item.sellingPrice || 0,
          finalPrice: selling,
          totalCost: rowTotalCost,
          totalSelling: rowTotalSelling,
          status: statusName,
          imei: (item.imei || []).join(", "),
        });

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle" };

          // Color code status text
          if (columns[colNumber - 1].key === "status") {
            cell.font = {
              color: { argb: statusConfig[statusName].text },
              bold: true,
            };
          }
        });
      });

      worksheet.addRow([]); // Spacer after table
      worksheet.addRow([]); // Extra Spacer
    });

    // 3. Grand Totals
    const summaryRow = worksheet.addRow({
      name: "GRAND TOTAL INVENTORY VALUE",
      totalCost: totalStockValueCost,
      totalSelling: totalStockValueSelling,
    });
    summaryRow.font = { bold: true, size: 12 };
    summaryRow.height = 25;
    worksheet.mergeCells(`B${summaryRow.number}:J${summaryRow.number}`);
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

    // 4. Currency Formatting
    [
      "costPrice",
      "sellingPrice",
      "finalPrice",
      "totalCost",
      "totalSelling",
    ].forEach((key) => {
      worksheet.getColumn(key).numFmt = "₹#,##0.00";
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `Stock_Report_${branchName.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`,
    );
  };

  return (
    <div className="products-container">
      <div className="products-header">
        <div className="header-left">
          <BackButton />
          <h1>{currentBranch ? currentBranch.name : "Branch"} Inventory</h1>
          <p className="products-count">
            {filteredProducts.length} items found
          </p>
        </div>
        <div className="header-right">
          <button
            className="add-product-btn"
            onClick={() => {
              setEditItem(null);
              setAddModalOpen(true);
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Assign Product
          </button>
        </div>
      </div>

      <div className="products-filters">
        <div className="search-box">
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

        <div className="filter-group">
          <label>Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((cat) => (
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
            Reset
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
            Export Report
          </button>
        </div>
      </div>

      <div className="products-grid">
        {loading ? (
          <div className="w-100 text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : safeInventory.length === 0 ? (
          <div className="no-data-msg w-100 text-center py-5">
            <h3>No inventory items in this branch</h3>
            <p className="text-muted">
              Click 'Add New Product' to stock this branch.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products w-100 text-center py-5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              className="text-secondary mb-3"
            >
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3>No products match your search</h3>
            <p className="text-muted">
              Try adjusting your filters or search term
            </p>
          </div>
        ) : (
          filteredProducts.map((item) => {
            const product = item.product || {};
            const categoryName = product.category?.name || "General";
            const status = getStatus(item);

            return (
              <div key={item._id} className="product-card">
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-category">{categoryName}</p>
                  <p className="product-price">
                    ₹{item.FinalPrice}/{product.unit}
                  </p>
                  {categoryName === "Mobiles" &&
                    item.imei &&
                    item.imei.length > 0 && (
                      <div className="mt-2">
                        <p className="small text-muted mb-1 fw-bold">IMEIs:</p>
                        <div className="d-flex flex-wrap gap-1">
                          {item.imei.map((imei, idx) => (
                            <span
                              key={idx}
                              className="badge bg-light text-dark border"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {imei}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
                <div className="product-stock">
                  <div className="stock-info-row">
                    <span className={`stock-badge ${getStockClass(status)}`}>
                      {status === "N/A" ? "Service" : status}
                    </span>
                    {status !== "N/A" && (
                      <p className="stock-quantity">{item.quantity} units</p>
                    )}
                  </div>

                  {status !== "N/A" && (
                    <div className="quick-stock-actions">
                      {editingStockId === item._id ? (
                        <div className="quick-stock-form">
                          <input
                            type="number"
                            value={newStockValue}
                            onChange={(e) => setNewStockValue(e.target.value)}
                            className="stock-input"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            placeholder="Qty"
                          />
                          <button
                            className="btn-save-stock"
                            onClick={() => saveQuickStockEdit(item._id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn-cancel-stock"
                            onClick={cancelQuickStockEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-quick-update"
                          onClick={() => startQuickStockEdit(item)}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Update Stock
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="product-actions">
                  <button
                    className="btn-edit"
                    style={{
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      borderColor: "#6366f1",
                      color: "white",
                    }}
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    View
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => handleEditClick(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteClick(item)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Universal Delete Modal */}
      <UniversalDelete
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={confirmDelete}
        title="Delete Inventory"
        message="Are you sure you want to remove this product from the branch inventory?"
        itemName={inventoryToDelete?.product?.name}
        isLoading={isDeleting}
      />

      <AddInventoryModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditItem(null);
        }}
        branchId={id}
        onAdd={handleAddInventory}
        onUpdate={handleUpdateInventory}
        editItem={editItem}
        existingProductIds={safeInventory.map((item) => item.product?._id)}
      />
    </div>
  );
};

export default BranchProducts;
