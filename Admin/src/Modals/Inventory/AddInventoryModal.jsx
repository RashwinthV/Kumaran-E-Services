import React, { useState, useEffect } from "react";
import "../../Styles/ProductModal.css"; // Reuse existing modal styles
import { useProduct } from "../../Context/ProductContext";

const AddInventoryModal = ({
  isOpen,
  onClose,
  branchId,
  onAdd,
  onUpdate,
  editItem,
  existingProductIds = [],
}) => {
  const { products, getProducts } = useProduct();
  const [step, setStep] = useState(1); // 1: Select Product, 2: Add Details
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Inventory Fields
  const [formData, setFormData] = useState({
    quantity: 0,
    costPrice: 0,
    sellingPrice: 20, // Default margin 20%
    finalPrice: 0,
    lowStockThreshold: 5,
    imei: [],
  });
  const [currentImei, setCurrentImei] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        // Edit Mode
        setStep(2);
        setSelectedProduct(editItem.product);
        setFormData({
          quantity: editItem.quantity,
          costPrice: editItem.costPrice,
          sellingPrice: editItem.sellingPrice,
          finalPrice: editItem.FinalPrice,
          lowStockThreshold: editItem.lowStockThreshold,
          imei: editItem.imei || [],
        });
      } else {
        if (products.length === 0) getProducts();

        setStep(1);
        setSelectedProduct(null);
        setSearchTerm("");
        setFormData({
          quantity: 0,
          costPrice: 0,
          sellingPrice: 20,
          finalPrice: 0,
          lowStockThreshold: 5,
          imei: [],
        });
        setCurrentImei("");
      }
    }
  }, [isOpen, editItem]);

  const isServiceProduct = (product) => {
    if (!product) return false;
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

  const filteredProducts = products.filter((p) => {
    // Exclude already added products if they exist in this branch
    if (existingProductIds.includes(p._id)) return false;

    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.brand && p.brand.toLowerCase().includes(term)) ||
      (p.model && p.model.toLowerCase().includes(term))
    );
  });

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    if (isServiceProduct(product)) {
      setFormData({
        quantity: 999999,
      });
    }
    setStep(2);
  };

  const handleChangeproduct=()=>{
    setStep(1);
    setSelectedProduct(null);
    setSearchTerm("");
    setFormData({
      quantity: 0,
      costPrice: 0,
      sellingPrice: 20,
      finalPrice: 0,
      lowStockThreshold: 5,
      imei: [],
    });
    setCurrentImei("");
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Auto-calculate Final Price based on CP and Margin
    if (name === "costPrice" || name === "sellingPrice") {
      const cp =
        name === "costPrice" ? Number(value) : Number(formData.costPrice);
      const margin =
        name === "sellingPrice" ? Number(value) : Number(formData.sellingPrice);

      if (!isNaN(cp) && !isNaN(margin)) {
        const calculatedFinal = cp + (cp * margin) / 100;
        newFormData.finalPrice = Number(calculatedFinal.toFixed(2));
      }
    }

    // Auto-calculate Margin based on Final Price and CP
    if (name === "finalPrice") {
      const fp = Number(value);
      const cp = Number(formData.costPrice);

      if (!isNaN(fp) && !isNaN(cp) && cp !== 0) {
        const calculatedMargin = ((fp - cp) / cp) * 100;
        newFormData.sellingPrice = Number(calculatedMargin.toFixed(2));
      }
    }

    setFormData(newFormData);
  };

  const handleImeiAdd = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      if (currentImei.trim()) {
        if (formData.imei.includes(currentImei.trim())) {
          alert("IMEI already added");
          return;
        }
        const updatedImei = [...formData.imei, currentImei.trim()];
        setFormData({
          ...formData,
          imei: updatedImei,
          quantity: updatedImei.length,
        });
        setCurrentImei("");
      }
    }
  };

  const handleImeiRemove = (index) => {
    const updatedImei = formData.imei.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      imei: updatedImei,
      quantity: updatedImei.length,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate against MRP
    const productMRP = selectedProduct.mrp;

    if (Number(formData.costPrice) > productMRP) {
      alert(
        `Cost Price (₹${formData.costPrice}) cannot exceed MRP (₹${productMRP})`,
      );
      return;
    }

    if (Number(formData.finalPrice) > productMRP) {
      alert(
        `Final Price (₹${formData.finalPrice}) cannot exceed MRP (₹${productMRP})`,
      );
      return;
    }

    const isService = isServiceProduct(selectedProduct);
    const inventoryData = {
      branch: branchId,
      product: selectedProduct._id,
      productDetails: selectedProduct,
      quantity: isService ? 0 : Number(formData.quantity),
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      FinalPrice: Number(formData.finalPrice),
      lowStockThreshold: isService ? 0 : Number(formData.lowStockThreshold),
      imei: formData.imei,
    };

    if (editItem && onUpdate) {
      onUpdate(editItem._id, inventoryData);
    } else if (onAdd) {
      onAdd(inventoryData);
    }

    onClose();
  };

  if (!isOpen) return null;
  console.log(selectedProduct);

  return (
    <div className="product-modal-overlay">
      <div
        className="product-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px" }}
      >
        <div className="modal-header">
          <h2>
            {editItem
              ? "Edit Inventory"
              : step === 1
                ? "Select Product to Add"
                : "Add Inventory Details"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {step === 1 && !editItem && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                height: "100%",
              }}
            >
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Search by Name, SKU, Brand or Model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              <div
                className="products-list-scroll"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  maxHeight: "400px",
                }}
              >
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleProductSelect(product)}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f7fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: "600", color: "#2d3748" }}>
                          {product.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.80rem",
                            background: product.isActive
                              ? "#e6fffa"
                              : "#fff5f5",
                            color: product.isActive ? "#319795" : "#e53e3e",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#718096",
                          display: "flex",
                          gap: "10px",
                        }}
                      >
                        <span>SKU: {product.sku}</span>
                        {(product.brand || product.model) && (
                          <span>
                            | {product.brand} {product.model}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#a0aec0",
                    }}
                  >
                    No products found.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && selectedProduct && (
            <div className="form-grid">
              {/* Selected Product Summary */}
              <div
                className="form-group full-width"
                style={{
                  padding: "12px",
                  background: "#ebf8ff",
                  borderRadius: "8px",
                  border: "1px solid #bee3f8",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#2b6cb0",
                    fontWeight: "bold",
                  }}
                >
                  Selected Product
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    color: "#2c5282",
                  }}
                >
                  {selectedProduct.name}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#4299e1" }}>
                  SKU: {selectedProduct.sku}
                </div>
                {!editItem && (
                  <button
                    type="button"
                    onClick={handleChangeproduct}
                    className="btn border border-primary w-10 align-self-center text-primary fw-bold"
                  >
                    Change Product
                  </button>
                )}
              </div>

              {!isServiceProduct(selectedProduct) && (
                <>
                  <div className="section-divider">Stock & Quantity</div>

                  <div className="form-group">
                    <label>Inventory Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="0"
                      required
                      readOnly={selectedProduct.category.name === "Mobiles"}
                      style={{
                        backgroundColor:
                          selectedProduct.category.name === "Mobiles"
                            ? "#f7fafc"
                            : "inherit",
                      }}
                    />
                    {selectedProduct.category.name === "Mobiles" && (
                      <small style={{ color: "#718096" }}>
                        Quantity is automatically set based on IMEI numbers
                        added below.
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      name="lowStockThreshold"
                      value={formData.lowStockThreshold}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>
                </>
              )}

              {selectedProduct.category.name === "Mobiles" && (
                <div className="form-group full-width">
                  <div className="section-divider text-center">IMEI DATA:</div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }} className="full-width">
                      <label className="text-start mx-4">Enter IMEI No:</label>
                      <input
                      style={{width:"600px"}}
                        type="text"
                        value={currentImei}
                        onChange={(e) => setCurrentImei(e.target.value)}
                        onKeyDown={handleImeiAdd}
                        placeholder="Scan or Enter IMEI and press Enter"
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleImeiAdd}
                      className="btn btn-primary"
                      style={{ marginTop: "1.8rem", height: "38px" }}
                    >
                      Add
                    </button>
                  </div>
                  {formData.imei.length > 0 && (
                    <div
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      {formData.imei.map((imei, index) => (
                        <div
                          key={index}
                          style={{
                            background: "#edf2f7",
                            padding: "4px 10px",
                            borderRadius: "15px",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            border: "1px solid #cbd5e0",
                          }}
                        >
                          <span>{imei}</span>
                          <button
                            type="button"
                            onClick={() => handleImeiRemove(index)}
                            style={{
                              border: "none",
                              background: "none",
                              color: "#e53e3e",
                              cursor: "pointer",
                              padding: "0",
                              fontSize: "1rem",
                              lineHeight: "1",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="section-divider">
                Pricing ({selectedProduct.unit}) - MRP: ₹{selectedProduct.mrp}
              </div>

              <div className="form-group">
                <label>
                  {isServiceProduct(selectedProduct)
                    ? "Production/Buying Cost (Optional for Services)"
                    : "Cost Price (Purchase Price)"}
                </label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  min="0"
                  max={selectedProduct.mrp}
                  step="0.01"
                  required
                  placeholder={
                    isServiceProduct(selectedProduct)
                      ? "Set to 0 if no cost involved"
                      : "Rate you bought at"
                  }
                  style={{
                    borderColor:
                      Number(formData.costPrice) > selectedProduct.mrp
                        ? "#e53e3e"
                        : undefined,
                    backgroundColor:
                      Number(formData.costPrice) > selectedProduct.mrp
                        ? "#fff5f5"
                        : isServiceProduct(selectedProduct)
                          ? "#f8fafc"
                          : undefined,
                  }}
                />
                {isServiceProduct(selectedProduct) && (
                  <small style={{ color: "#718096" }}>
                    Service detected: Cost price defaults to 0 for maximum
                    profit tracking.
                  </small>
                )}
                {Number(formData.costPrice) > selectedProduct.mrp && (
                  <small style={{ color: "#e53e3e", fontWeight: "bold" }}>
                    ⚠️ Cost Price cannot exceed MRP (₹{selectedProduct.mrp})
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Profit Margin %</label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  required
                  placeholder="e.g. 20 for 20%"
                />
              </div>

              <div className="form-group full-width">
                <label>Final Selling Price</label>
                <input
                  type="number"
                  name="finalPrice"
                  value={formData.finalPrice}
                  onChange={handleChange}
                  step="0.01"
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    borderColor:
                      Number(formData.finalPrice) > selectedProduct.mrp
                        ? "#e53e3e"
                        : "#48bb78",
                    backgroundColor:
                      Number(formData.finalPrice) > selectedProduct.mrp
                        ? "#fff5f5"
                        : "#f0fff4",
                  }}
                />
                {Number(formData.finalPrice) > selectedProduct.mrp ? (
                  <small style={{ color: "#e53e3e", fontWeight: "bold" }}>
                    ⚠️ Final Price cannot exceed MRP (₹{selectedProduct.mrp})
                  </small>
                ) : (
                  <small style={{ color: "#718096" }}>
                    Calculated as: Cost Price + (Cost Price × Margin %)
                  </small>
                )}
              </div>
            </div>
          )}
        </form>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>

          {step === 2 && (
            <button className="btn-submit" onClick={handleSubmit}>
              {editItem ? "Update Inventory" : "Add to Inventory"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddInventoryModal;
