import React, { useState } from "react";
import { useProduct } from "../../Context/ProductContext";
import UniversalDelete from "../UniversalDelete";
import "../../Styles/ProductModal.css";

const CategoryRow = ({ category, onEdit, onDelete }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem",
      borderBottom: "1px solid #edf2f7",
    }}
  >
    <span style={{ fontWeight: 500 }}>{category.name}</span>
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        onClick={() => onEdit(category)}
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
        onClick={() => onDelete(category)}
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

const CategoryModal = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useProduct();
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Delete Modal State within this modal
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setEditingCategory(null);
    }
  }, [isOpen]);

  const handleEditClick = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setName("");
  };

  const handleDeleteClick = (cat) => {
    setDeleteData(cat);
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deleteData._id);
      setDeleteData(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, name);
      } else {
        await addCategory(name);
      }
      setName("");
      setEditingCategory(null);
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
            <h2>Manage Categories</h2>
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
            {/* Add / Edit Form Section */}
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
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", gap: "0.5rem" }}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category Name"
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
                  disabled={loading}
                  style={{ padding: "0.5rem 1rem", width: "auto", margin: 0 }}
                >
                  {loading ? "..." : editingCategory ? "Update" : "Add"}
                </button>
                {editingCategory && (
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
                Existing Categories
              </h3>
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.375rem",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {categories.map((cat) => (
                  <CategoryRow
                    key={cat._id}
                    category={cat}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
                {categories.length === 0 && (
                  <div
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "#718096",
                    }}
                  >
                    No categories found.
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
          title="Delete Category"
          message={`Are you sure you want to delete "${deleteData.name}"?`}
          itemName={deleteData.name}
          isLoading={isDeleting}
        />
      )}
    </>
  );
};

export default CategoryModal;
