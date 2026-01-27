import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import "../../Styles/Employee.css";
import { useAuth } from "../../Context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import UniversalDelete from "../../Modals/UniversalDelete";

const ViewEmployee = ({ BranchCode, onEdit }) => {
  const { user, accessToken } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const baseURL = `${import.meta.env.VITE_BACKEND_BASE_URI}/admin`;

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        if (!user || !BranchCode) return;
        setLoading(true);

        const response = await axios.get(
          `${baseURL}/${user.id}/employees/${BranchCode}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (response.data.success) {
          setEmployees(response.data.employees);
        }
      } catch (error) {
        console.error("Fetch employees error:", error);
        if (
          error.response?.data?.message !== "No employee found for this branch"
        ) {
          toast.error(
            error.response?.data?.message || "Failed to load employees",
          );
        } else {
          setEmployees([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [BranchCode, user, accessToken, baseURL]);

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      setIsDeleting(true);
      await axios.delete(`${baseURL}/employees/${employeeToDelete._id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      toast.success("Employee deleted successfully");
      setEmployees((prev) =>
        prev.filter((e) => e._id !== employeeToDelete._id),
      );
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Error deleting employee");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="employees-grid"
        style={{
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gridColumn: "1 / -1",
        }}
      >
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {employees.length > 0 ? (
        <div className="employees-grid">
          {employees.map((employee) => (
            <div key={employee._id} className="employee-card">
              <div className="card-header">
                <div className="employee-identity">
                  <div className="employee-avatar">
                    {employee.name
                      ? employee.name.charAt(0).toUpperCase()
                      : "?"}
                  </div>
                  <div>
                    <div className="employee-name">
                    <span style={{marginBottom:"20px"}}>  {employee.name.toUpperCase()} </span><br />
                      EMP ID : {employee?.employeeId}
                    </div>
                    <span className={`role-badge ${employee.role}`}>
                      {employee.role}
                    </span>
                    <span
                      className={`status-badge mx-2 ${
                        employee.status?.toLowerCase() || "active"
                      }`}
                    >
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <i className="bi bi-envelope"></i>
                  <span>{employee.email}</span>
                </div>
                <div className="info-row">
                  <i className="bi bi-telephone"></i>
                  <span>{employee.phone}</span>
                </div>
                <div className="info-row">
                  <i className="bi bi-calendar"></i>
                  <span>{employee.age} years old</span>
                </div>
                {employee.PayPerDay && (
                  <div className="info-row">
                    <i className="bi bi-cash"></i>
                    <span>₹{employee.PayPerDay}</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <div className="action-buttons">
                  <button
                    className="action-btn edit-btn"
                    title="Edit"
                    onClick={() => onEdit && onEdit(employee)}
                  >
                    <i className="bi bi-pencil-square fw-bold fs-5"></i> Edit
                  </button>
                  <button
                    className="action-btn delete-btn"
                    title="Delete"
                    onClick={() => handleDeleteClick(employee)}
                  >
                    <i className="bi bi-trash-fill"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-employees">
          <i className="bi bi-people"></i>
          <h3>No employees found</h3>
          <p>Add a new employee to this branch.</p>
        </div>
      )}

      {/* Universal Delete Modal */}
      <UniversalDelete
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={confirmDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        itemName={employeeToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ViewEmployee;
