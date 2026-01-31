import React, { useState, useEffect, useMemo } from "react";
import { useProduct } from "../../Context/ProductContext";
import CategoryModal from "./CategoryModal";
import SubCategoryModal from "./SubCategoryModal";
import BarcodeInput from "../../Components/BarcodeInput";
import "../../Styles/ProductModal.css";

const ProductModal = ({ isOpen, onClose, productToEdit = null }) => {
  const {
    addProduct,
    updateProduct,
    categories,
    getCategories,
    subCategories: allSubCategories,
    getSubCategories,
  } = useProduct();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    subCategory: "",
    unit: "pcs",
    price: "",
    gstType: "NotIncluded",
    commonGst: "0",
    brand: "",
    model: "",
  });

  // Tags and Compatible Models state (managed separately from simple string inputs)
  const [tags, setTags] = useState([]);
  const [compatibleModels, setCompatibleModels] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [modelInput, setModelInput] = useState("");

  // Modal states for adding Category/SubCategory
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);

  // Fetch categories and subcategories on mount if not loaded
  useEffect(() => {
    if (isOpen) {
      if (categories.length === 0) getCategories();
      if (allSubCategories.length === 0) getSubCategories();
    }
  }, [
    isOpen,
    categories.length,
    allSubCategories.length,
    getCategories,
    getSubCategories,
  ]);

  // Derived filtered subcategories
  const filteredSubCategories = useMemo(() => {
    if (!formData.category) return [];
    return allSubCategories.filter(
      (sub) => (sub.category?._id || sub.category) === formData.category,
    );
  }, [allSubCategories, formData.category]);

  // Load product data when editing
  useEffect(() => {
    if (productToEdit) {
      // Calculate common GST from component parts if possible, or just take cgst * 2
      const cgst = productToEdit.gst?.cgst || 0;
      const sgst = productToEdit.gst?.sgst || 0;
      const commonGstVal = (cgst + sgst).toString();

      setFormData({
        name: productToEdit.name,
        sku: productToEdit.sku,
        category: productToEdit.category?._id || productToEdit.category,
        subCategory:
          productToEdit.subCategory?._id || productToEdit.subCategory,
        unit: productToEdit.unit,
        price: productToEdit.mrp,
        gstType: productToEdit.gstType,
        commonGst: commonGstVal,
        brand: productToEdit.brand || "",
        model: productToEdit.model || "",
      });
      setTags(productToEdit.tags || []);
      setCompatibleModels(productToEdit.compatibleModels || []);

      // Fetch subcategories for the existing category
      if (productToEdit.category) {
        handleCategoryChange(
          productToEdit.category?._id || productToEdit.category,
          true,
        );
      }
    } else {
      // Reset form
      setFormData({
        name: "",
        sku: "",
        category: "",
        subCategory: "",
        unit: "pcs",
        price: "",
        gstType: "NotIncluded",
        commonGst: "0",
        brand: "",
        model: "",
      });
      setTags([]);
      setCompatibleModels([]);
      setTagInput("");
      setModelInput("");
    }
  }, [productToEdit, isOpen]);

  const handleCategoryChange = (categoryId, preserveSubCategory = false) => {
    if (!preserveSubCategory) {
      setFormData((prev) => ({
        ...prev,
        category: categoryId,
        subCategory: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, category: categoryId }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      handleCategoryChange(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Tag Handling
  const handleAddTag = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = type === "tags" ? tagInput.trim() : modelInput.trim();
      if (!val) return;

      if (type === "tags") {
        if (!tags.includes(val)) setTags([...tags, val]);
        setTagInput("");
      } else {
        if (!compatibleModels.includes(val))
          setCompatibleModels([...compatibleModels, val]);
        setModelInput("");
      }
    }
  };

  const removeTag = (tagToRemove, type) => {
    if (type === "tags") {
      setTags(tags.filter((t) => t !== tagToRemove));
    } else {
      setCompatibleModels(compatibleModels.filter((t) => t !== tagToRemove));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Split common GST
    const totalGst = Number(formData.commonGst) || 0;
    const splitGst = totalGst / 2;

    const payload = {
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      subCategory: formData.subCategory,
      unit: formData.unit,
      mrp: Number(formData.price),
      gstType: formData.gstType,
      gst: {
        cgst: splitGst,
        sgst: splitGst,
        isGstApplicable: formData.gstType !== "NotApplicable",
      },
      brand: formData.brand,
      model: formData.model,
      tags: tags,
      compatibleModels: compatibleModels,
    };

    try {
      if (productToEdit) {
        await updateProduct(productToEdit._id, payload);
      } else {
        await addProduct(payload);
      }
      onClose();
    } catch (error) {
      console.error("Form submission error", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="product-modal-overlay">
        <div className="product-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{productToEdit ? "Edit Product" : "Add New Product"}</h2>
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
            <div className="form-grid">
              {/* Basic Info */}
              <div className="form-group full-width">
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., iPhone 13 Pro Max Battery"
                  required
                />
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Apple"
                />
              </div>

              <div className="form-group">
                <label>Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g. A2643"
                />
              </div>

              <div className="form-group full-width">
                <label>SKU / Barcode</label>
                <BarcodeInput
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Categorization */}
              <div className="section-divider">Categorization</div>

              <div className="form-group">
                <label>Category</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-add-mini"
                    onClick={() => setIsCategoryModalOpen(true)}
                    title="Add New Category"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Sub Category</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    required
                    disabled={!formData.category}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Sub Category</option>
                    {filteredSubCategories.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-add-mini"
                    onClick={() => setIsSubCategoryModalOpen(true)}
                    disabled={!formData.category}
                    title="Add New SubCategory"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="section-divider">Pricing & Unit</div>

              <div className="form-group">
                <label>MRP</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="set">Set</option>
                  <option value="box">Box</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="ltr">Liter (ltr)</option>
                </select>
              </div>

              <div className="gst-section">
                <div className="gst-grid">
                  <div className="form-group">
                    <label>GST Type</label>
                    <select
                      name="gstType"
                      value={formData.gstType}
                      onChange={handleChange}
                    >
                      <option value="NotIncluded">Excluded (Extra)</option>
                      <option value="Included">Included in MRP</option>
                      <option value="NotApplicable">Not Applicable</option>
                    </select>
                  </div>

                  {formData.gstType !== "NotApplicable" && (
                    <div
                      className="form-group"
                      style={{ gridColumn: "span 2" }}
                    >
                      <label>Total GST %</label>
                      <input
                        type="number"
                        name="commonGst"
                        value={formData.commonGst}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        placeholder="e.g. 18"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="section-divider">Search Metadata (E-Service)</div>

              <div className="form-group full-width">
                <label>Compatible Models (Press Enter to add)</label>
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  onKeyDown={(e) => handleAddTag(e, "models")}
                  placeholder="Type model and press Enter (e.g. iPhone 13, SM-A528B)"
                />
                <div className="tags-container">
                  {compatibleModels.map((tag, idx) => (
                    <span key={idx} className="tag-badge">
                      {tag}{" "}
                      <span onClick={() => removeTag(tag, "models")}>×</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group full-width">
                <label>Tags / Keywords (Press Enter to add)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => handleAddTag(e, "tags")}
                  placeholder="e.g. Original, Warranty, Waterproof"
                />
                <div className="tags-container">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="tag-badge">
                      {tag}{" "}
                      <span onClick={() => removeTag(tag, "tags")}>×</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </form>

          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : productToEdit
                  ? "Update Product"
                  : "Add Product"}
            </button>
          </div>
        </div>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <SubCategoryModal
        isOpen={isSubCategoryModalOpen}
        onClose={() => setIsSubCategoryModalOpen(false)}
        defaultCategoryId={formData.category}
      />
    </>
  );
};

export default ProductModal;
