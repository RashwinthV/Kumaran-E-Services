import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import "../../Styles/Branch.css";
import { useBranch } from "../../Context/BranchContext";
import BackButton from "../../Components/BackButton";
import "bootstrap/dist/css/bootstrap.min.css";
import UniversalDelete from "../../Modals/UniversalDelete";

const Branch = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const {
    branches,
    getBranches,
    addBranch,
    updateBranch,
    deleteBranch,
    loading: contextLoading,
  } = useBranch();

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    },
    contact: {
      phone: "",
      email: "",
    },
    gstNumber: "",
    status: "Active",
    AccessCode: "",
    OwnerShip: "Owned",
    leasedetails: {
      leaseholdername: "",
      leaseholdercontact: "",
      leaseholderemail: "",
      leaseholderaddress: {
        street: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },
      Leasedamount: "",
      LeasedFrequency: "Monthly",
      LeasedPeriod: {
        LeasedStartDate: "",
        LeasedEndDate: "",
      },
    },
    rentdetails: {
      rentamount: "",
      rentfrequency: "Monthly",
    },
  });

  const validateAccessCode = (AccessCode) => {
    if (!AccessCode) return null; // Allow empty details for validation logic if optional, but checks inside handleSubmit will enforce requirements
    const hasUpperCase = /[A-Z]/.test(AccessCode);
    const hasLowerCase = /[a-z]/.test(AccessCode);
    const hasNumber = /\d/.test(AccessCode);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      AccessCode
    );

    if (!hasUpperCase)
      return "AccessCode must contain at least one uppercase letter";
    if (!hasLowerCase)
      return "AccessCode must contain at least one lowercase letter";
    if (!hasNumber) return "AccessCode must contain at least one number";
    if (!hasSpecialChar)
      return "AccessCode must contain at least one special character";
    return null;
  };

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load branches on component mount or when access token changes
  useEffect(() => {
    if (accessToken) getBranches();
  }, [accessToken, getBranches]);

  const handleOpenModal = () => {
    setFormData({
      name: "",
      code: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },
      contact: {
        phone: "",
        email: "",
      },
      gstNumber: "",
      status: "Active",
      AccessCode: "",
      OwnerShip: "Owned",
      leasedetails: {
        leaseholdername: "",
        leaseholdercontact: "",
        leaseholderemail: "",
        leaseholderaddress: {
          street: "",
          city: "",
          state: "",
          country: "India",
          pincode: "",
        },
        Leasedamount: "",
        LeasedFrequency: "Monthly",
        LeasedPeriod: {
          LeasedStartDate: "",
          LeasedEndDate: "",
        },
      },
      rentdetails: {
        rentamount: "",
        rentfrequency: "Monthly",
      },
    });
    setShowModal(true);
  };

  const handleViewBranch = (branchId) => {
    navigate(`/branch/${branchId}`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const parts = name.split(".");
      if (parts.length === 2) {
        setFormData((prev) => ({
          ...prev,
          [parts[0]]: {
            ...prev[parts[0]],
            [parts[1]]: value,
          },
        }));
      } else if (parts.length === 3) {
        setFormData((prev) => ({
          ...prev,
          [parts[0]]: {
            ...prev[parts[0]],
            [parts[1]]: {
              ...prev[parts[0]][parts[1]],
              [parts[2]]: value,
            },
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const AccessCodeError = formData.AccessCode
        ? validateAccessCode(formData.AccessCode)
        : null;

      if (AccessCodeError) {
        alert(AccessCodeError); // Ideally replace with a proper toast or inline error
        return; // Don't proceed
      }

      await addBranch(formData);
      handleCloseModal();
    } catch (error) {
      console.error("Submit error:", error);
      // Toast is handled in context
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete modal
  const handleDeleteClick = (branch) => {
    setBranchToDelete(branch);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!branchToDelete) return;

    try {
      setIsDeleting(true);
      await deleteBranch(branchToDelete._id);
      setDeleteModalOpen(false);
      setBranchToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="branch-container">
      <div className="branch-header">
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <BackButton />
          <h1>Branch Management</h1>
        </div>
        <button className="add-branch-btn" onClick={handleOpenModal}>
          <i className="bi bi-plus-circle-fill"></i>
          Add New Branch
        </button>
      </div>

      {contextLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading branches...</p>
        </div>
      ) : branches.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-building"></i>
          <h3>No Branches Found</h3>
          <p>Get started by adding your first branch</p>
        </div>
      ) : (
        <div className="branch-grid">
          {branches.map((branch) => (
            <div key={branch._id} className="branch-card">
              <div className="branch-card-header">
                <div>
                  <h3>{branch.name}</h3>
                  <span className="branch-code">{branch.code}</span>
                </div>
                <span className={`status-badge ${branch.status.toLowerCase()}`}>
                  {branch.status}
                </span>
              </div>

              <div className="branch-card-body">
                <div className="branch-info">
                  <div className="info-item">
                    <i className="bi bi-geo-alt-fill"></i>
                    <div>
                      <p className="info-label">Address</p>
                      <p className="info-value">
                        {branch.address.street}, {branch.address.city}
                      </p>
                      <p className="info-value-small">
                        {branch.address.state}, {branch.address.pincode}
                      </p>
                    </div>
                  </div>

                  <div className="info-item">
                    <i className="bi bi-telephone-fill"></i>
                    <div>
                      <p className="info-label">Contact</p>
                      <p className="info-value">{branch.contact.phone}</p>
                      <p className="info-value-small">{branch.contact.email}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <i className="bi bi-file-earmark-text-fill"></i>
                    <div>
                      <p className="info-label">GST Number</p>
                      <p className="info-value">{branch.gstNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="branch-card-footer">
                <button
                  className="btn-view"
                  onClick={() => handleViewBranch(branch._id)}
                >
                  <i className="bi bi-eye-fill"></i>
                  View Details
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteClick(branch)}
                >
                  <i className="bi bi-trash-fill"></i>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" >
          <div
            className="modal-content"
            style={{ backgroundColor: "white" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <i className="bi bi-building-fill-add"></i>
                <h2>Add New Branch</h2>
              </div>
              <button className="close-btn" onClick={handleCloseModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-section">
                  <h3 className="section-title">
                    <i className="bi bi-building"></i>
                    Branch Information
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-shop"></i>
                        Branch Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter branch name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <i className="bi bi-tag-fill"></i>
                        Branch Code *
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="e.g., MB001"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <i className="bi bi-geo-alt-fill"></i>
                    Address Details
                  </h3>
                  <div className="form-group">
                    <label>
                      <i className="bi bi-signpost-fill"></i>
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-building"></i>
                        City
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <i className="bi bi-map-fill"></i>
                        State
                      </label>
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        placeholder="Enter state"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-globe"></i>
                        Country
                      </label>
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleInputChange}
                        placeholder="Enter country"
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <i className="bi bi-mailbox"></i>
                        Pincode
                      </label>
                      <input
                        type="text"
                        name="address.pincode"
                        value={formData.address.pincode}
                        onChange={handleInputChange}
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <i className="bi bi-telephone-fill"></i>
                    Contact Information
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-phone-fill"></i>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="contact.phone"
                        value={formData.contact.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit phone number"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <i className="bi bi-envelope-fill"></i>
                        Email
                      </label>
                      <input
                        type="email"
                        name="contact.email"
                        value={formData.contact.email}
                        onChange={handleInputChange}
                        placeholder="branch@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <i className="bi bi-file-earmark-text-fill"></i>
                    Additional Details
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-receipt"></i>
                        GST Number
                      </label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        placeholder="Enter GST number"
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <i className="bi bi-toggle-on"></i>
                        Status *
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <i className="bi bi-building-gear"></i>
                    Ownership Details
                  </h3>
                  <div className="form-group">
                    <label>
                      <i className="bi bi-houses-fill"></i>
                      Ownership Type
                    </label>
                    <select
                      name="OwnerShip"
                      value={formData.OwnerShip}
                      onChange={handleInputChange}
                    >
                      <option value="Owned">Owned</option>
                      <option value="Leased">Leased</option>
                      <option value="Rented">Rented</option>
                    </select>
                  </div>

                  {formData.OwnerShip === "Leased" && (
                    <div className="nested-form-group">
                      <h4 className="sub-section-title">
                        Lease Holder Details
                      </h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name</label>
                          <input
                            type="text"
                            name="leasedetails.leaseholdername"
                            value={formData.leasedetails.leaseholdername}
                            onChange={handleInputChange}
                            placeholder="Lease holder name"
                          />
                        </div>
                        <div className="form-group">
                          <label>Contact</label>
                          <input
                            type="text"
                            name="leasedetails.leaseholdercontact"
                            value={formData.leasedetails.leaseholdercontact}
                            onChange={handleInputChange}
                            placeholder="Contact number"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="leasedetails.leaseholderemail"
                          value={formData.leasedetails.leaseholderemail}
                          onChange={handleInputChange}
                          placeholder="Email address"
                        />
                      </div>
                      <h5 className="mini-title mt-2">Lease Holder Address</h5>
                      <div className="form-group">
                        <label>Street</label>
                        <input
                          type="text"
                          name="leasedetails.leaseholderaddress.street"
                          value={
                            formData.leasedetails.leaseholderaddress.street
                          }
                          onChange={handleInputChange}
                          placeholder="Street Address"
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>City</label>
                          <input
                            type="text"
                            name="leasedetails.leaseholderaddress.city"
                            value={
                              formData.leasedetails.leaseholderaddress.city
                            }
                            onChange={handleInputChange}
                            placeholder="City"
                          />
                        </div>
                        <div className="form-group">
                          <label>Pincode</label>
                          <input
                            type="text"
                            name="leasedetails.leaseholderaddress.pincode"
                            value={
                              formData.leasedetails.leaseholderaddress.pincode
                            }
                            onChange={handleInputChange}
                            placeholder="Pincode"
                          />
                        </div>
                      </div>

                      <h5 className="mini-title mt-2">Lease Terms</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Lease Amount</label>
                          <input
                            type="text"
                            name="leasedetails.Leasedamount"
                            value={formData.leasedetails.Leasedamount}
                            onChange={handleInputChange}
                            placeholder="e.g. 50000"
                          />
                        </div>
                        <div className="form-group">
                          <label>Frequency</label>
                          <select
                            name="leasedetails.LeasedFrequency"
                            value={formData.leasedetails.LeasedFrequency}
                            onChange={handleInputChange}
                          >
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Yearly">Yearly</option>
                            <option value="One Time">One Time</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Start Date</label>
                          <input
                            type="date"
                            name="leasedetails.LeasedPeriod.LeasedStartDate"
                            value={
                              formData.leasedetails.LeasedPeriod
                                ?.LeasedStartDate
                            }
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group">
                          <label>End Date</label>
                          <input
                            type="date"
                            name="leasedetails.LeasedPeriod.LeasedEndDate"
                            value={
                              formData.leasedetails.LeasedPeriod?.LeasedEndDate
                            }
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.OwnerShip === "Rented" && (
                    <div className="nested-form-group">
                      <h4 className="sub-section-title">Rent Details</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Rent Amount</label>
                          <input
                            type="text"
                            name="rentdetails.rentamount"
                            value={formData.rentdetails.rentamount}
                            onChange={handleInputChange}
                            placeholder="e.g. 15000"
                          />
                        </div>
                        <div className="form-group">
                          <label>Frequency</label>
                          <select
                            name="rentdetails.rentfrequency"
                            value={formData.rentdetails.rentfrequency}
                            onChange={handleInputChange}
                          >
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Yearly">Yearly</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <i className="bi bi-shield-lock-fill"></i>
                    Security
                  </h3>
                  <div className="form-group">
                    <label>
                      <i className="bi bi-key-fill"></i>
                      AccessCode *
                    </label>
                    <input
                      type="AccessCode"
                      name="AccessCode"
                      value={formData.AccessCode}
                      onChange={handleInputChange}
                      placeholder="Enter AccessCode"
                      title="Must contain at least one uppercase, one lowercase, one number, and one special character"
                      required
                    />
                    <small
                      className="text-muted"
                      style={{
                        fontSize: "0.8rem",
                        display: "block",
                        marginTop: "5px",
                      }}
                    >
                      1 uppercase, 1 lowercase, 1 number, 1 special char
                    </small>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  <i className="bi bi-x-circle-fill"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill"></i>
                      Add Branch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Delete Modal */}
      <UniversalDelete
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={confirmDelete}
        title="Delete Branch"
        message="Are you sure you want to delete this branch? This action cannot be undone and will permanently remove all associated data."
        itemName={branchToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Branch;
