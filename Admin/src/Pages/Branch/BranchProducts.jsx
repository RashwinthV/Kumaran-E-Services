import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "../../Styles/Products.css";
import UniversalDelete from "../../Modals/UniversalDelete";
import AddInventoryModal from "../../Modals/Inventory/AddInventoryModal";
import { useBranch } from "../../Context/BranchContext";
import BackButton from "../../Components/BackButton";

const BranchProducts = () => {
  const { id } = useParams();
  const {
    branchInventory,
    getInventory,
    addInventory: addInventoryApi,
    updateInventory,
    deleteInventory,
    loading,
  } = useBranch();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

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
    if (id) {
      getInventory(id);
    }
  }, [id, getInventory]);

  // Helper function to determine status
  function getStatus(item) {
    if (!item || !item.product) return "Unknown";

    const catName = (item.product.category?.name || "").toLowerCase();
    const productName = (item.product.name || "").toLowerCase();

    const serviceKeywords = [
      "other",
      "service",
      "xerox",
      "scan",
      "photograph",
      "internet",
      "printing",
      "typing",
      "online",
    ];

    const isService = serviceKeywords.some(
      (key) => catName.includes(key) || productName.includes(key)
    );

    if (isService) return "N/A";

    if (item.quantity === 0) return "Out of Stock";
    if (item.quantity <= item.lowStockThreshold) return "Low Stock";
    return "In Stock";
  }
  console.log(branchInventory);

  // Ensure branchInventory is an array to prevent crashes
  const safeInventory = Array.isArray(branchInventory) ? branchInventory : [];

  // Extract unique categories from loaded inventory
  const categories = [
    "All",
    ...new Set(
      safeInventory.map((item) => item.product?.category?.name || "General")
    ),
  ];

  const filteredProducts = safeInventory
    .filter((item) => {
      // Inventory item structure: { product: { name, ... }, quantity, ... }
      const productName = item.product?.name || "";
      const categoryName = item.product?.category?.name || "General";
      const status = getStatus(item);

      const matchesSearch = productName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === "All" || categoryName === filterCategory;

      const matchesStatus = filterStatus === "All" || status === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
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

  return (
    <div className="products-container">
      <div className="products-header">
        <div className="header-left">
          <BackButton />
          <h1>Products Management</h1>
          <p className="products-count">
            {filteredProducts.length} products found
          </p>
        </div>
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
          Add New Product
        </button>
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
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
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
