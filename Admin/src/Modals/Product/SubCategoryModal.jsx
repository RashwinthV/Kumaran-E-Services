import React, { useState, useEffect, useMemo } from "react";
import { useProduct } from "../../Context/ProductContext";
import UniversalDelete from "../UniversalDelete";
import "../../Styles/ProductModal.css";

const SubCategoryRow = ({ subCategory, onEdit, onDelete }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem",
      borderBottom: "1px solid #edf2f7",
    }}
  >
    <span style={{ fontWeight: 500 }}>{subCategory.name}</span>
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        onClick={() => onEdit(subCategory)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#4a5568",
        }}
        title="Edit"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button
        onClick={() => onDelete(subCategory)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#e53e3e",
        }}
        title="Delete"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>
);

const SubCategoryModal = ({ isOpen, onClose, defaultCategoryId = "" }) => {
  const {
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    subCategories,
    getSubCategories,
    categories,
    getCategories,
  } = useProduct();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId || "");
  const [editingSub, setEditingSub] = useState(null);
  const [loading, setLoading] = useState(false);

  // Delete Modal State
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (categories.length === 0) getCategories();
      // Ensure we have all subcategories loaded to list them
      if (subCategories.length === 0) getSubCategories();
      if (defaultCategoryId) setCategoryId(defaultCategoryId);

      setName("");
      setEditingSub(null);
    }
  }, [
    isOpen,
    defaultCategoryId,
    categories.length,
    getCategories,
    subCategories.length,
    getSubCategories,
  ]);

  // Filter displayed subcategories based on selected category in the dropdown
  // If no category selected, show all? Or usually users want to see subs for specific category.
  // For 'Manage', if categoryId is set, show for that category.
  const displayedSubCategories = useMemo(() => {
    if (!categoryId) return [];
    return subCategories.filter(
      (sub) => sub.category?._id === categoryId || sub.category === categoryId,
    );
  }, [subCategories, categoryId]);

  const handleEditClick = (sub) => {
    setEditingSub(sub);
    setName(sub.name);
    // Ensure the correct category is set if for some reason we edit a sub from a mixed list
    if (!categoryId && sub.category) {
      setCategoryId(
        typeof sub.category === "object" ? sub.category._id : sub.category,
      );
    }
  };

  const cancelEdit = () => {
    setEditingSub(null);
    setName("");
  };

  const handleDeleteClick = (sub) => {
    setDeleteData(sub);
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      await deleteSubCategory(deleteData._id);
      // Refresh list locally or via context (deleteSubCategory already calls getProducts? No, need to refresh subs)
      // Actually context deleteSubCategory doesn't refresh automatically, I should check.
      // Context deleteSubCategory returns data but doesn't call getSubCategories(). I should call it manually here.
      getSubCategories();
      setDeleteData(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    setLoading(true);
    try {
      if (editingSub) {
        await updateSubCategory(editingSub._id, name, categoryId);
      } else {
        await addSubCategory(name, categoryId);
      }

      // Refresh list
      getSubCategories();

      setName("");
      setEditingSub(null);
      // Don't reset categoryId if passed as default, otherwise maybe keep it for rapid entry
      if (!defaultCategoryId && !editingSub) {
        // Optional: keep category selected for multiple entries
      }
      if (editingSub) {
        // If we were editing, maybe clear if we want fresh state, but keeping category context is usually better
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="product-modal-overlay" style={{ zIndex: 1100 }}>
        <div
          className="product-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "450px",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="modal-header">
            <h2>Manage Sub Categories</h2>
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

          <div
            className="modal-body"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            {/* Add / Edit Form */}
            <div
              style={{
                background: "#f7fafc",
                padding: "1rem",
                borderRadius: "0.5rem",
                border: "1px solid #edf2f7",
              }}
            >
              <h3
                style={{
                  fontSize: "0.9rem",
                  marginBottom: "0.75rem",
                  color: "#4a5568",
                }}
              >
                {editingSub ? "Edit Sub Category" : "Add New Sub Category"}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    disabled={!!defaultCategoryId} // Lock if opened from specific category context
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "0.25rem",
                      border: "1px solid #cbd5e0",
                    }}
                  >
                    <option value="">Select Parent Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sub Category Name"
                    required
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "0.25rem",
                      border: "1px solid #cbd5e0",
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading || !categoryId}
                    style={{ padding: "0.5rem 1rem", width: "auto", margin: 0 }}
                  >
                    {loading ? "..." : editingSub ? "Update" : "Add"}
                  </button>
                  {editingSub && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #cbd5e0",
                        background: "white",
                        borderRadius: "0.25rem",
                        cursor: "pointer",
                      }}
                    >
                      X
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Section */}
            <div>
              <h3
                style={{
                  fontSize: "1rem",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                {categoryId
                  ? "Existing Sub Categories"
                  : "Select a Category to view items"}
              </h3>
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.375rem",
                  maxHeight: "300px",
                  overflowY: "auto",
                  minHeight: "100px",
                }}
              >
                {displayedSubCategories.map((sub) => (
                  <SubCategoryRow
                    key={sub._id}
                    subCategory={sub}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
                {categoryId && displayedSubCategories.length === 0 && (
                  <div
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "#718096",
                    }}
                  >
                    No sub categories found for this category.
                  </div>
                )}
                {!categoryId && (
                  <div
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "#718096",
                    }}
                  >
                    Please select a parent category above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nested Delete Confirmation */}
      {deleteData && (
        <UniversalDelete
          isOpen={!!deleteData}
          onClose={() => setDeleteData(null)}
          onDelete={confirmDelete}
          title="Delete Sub Category"
          message={`Are you sure you want to delete "${deleteData.name}"?`}
          itemName={deleteData.name}
          isLoading={isDeleting}
        />
      )}
    </>
  );
};
export default SubCategoryModal;
