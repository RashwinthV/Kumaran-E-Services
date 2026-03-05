import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../../Styles/BranchDetail.css";
import { useBranch } from "../../Context/BranchContext";
import { useAuth } from "../../Context/AuthContext";
import BackButton from "../../Components/BackButton";

const BranchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const { branches, getBranches, updateBranch } = useBranch();
  const [branch, setBranch] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  const validateAccessCode = (AccessCode) => {
    if (!AccessCode) return null; // Optional for edit
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

  useEffect(() => {
    if (!accessToken) return;

    if (branches.length > 0) {
      const foundBranch = branches.find((b) => b._id === id);
      if (foundBranch) {
        setBranch(foundBranch);
        setFormData({ ...foundBranch, AccessCode: "" }); // Initialize AccessCode as empty string
      } else {
        navigate("/branch");
      }
    } else {
      getBranches();
    }
  }, [id, branches, accessToken, getBranches, navigate]);

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

  const handleSave = async () => {
    try {
      const AccessCodeError = formData.AccessCode
        ? validateAccessCode(formData.AccessCode)
        : null;

      if (AccessCodeError) {
        alert(AccessCodeError);
        return;
      }

      await updateBranch(id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update branch", error);
    }
  };

  const handleCancel = () => {
    const handleCancel = () => {
      setFormData({ ...branch, AccessCode: "" });
      setIsEditing(false);
    };
    setIsEditing(false);
  };

  if (!branch) return null;

  return (
    <div className="branch-detail-container">
      <div className="branch-detail-header">
        <div className="header-left">
          {/* BackButton replaces Link */}
          <BackButton label="Back" />
          <div className="branch-title">
            <h1>{branch.name}</h1>

            <span className={`status-badge ${branch.status.toLowerCase()}`}>
              {branch.status}
            </span>

            {!isEditing ? (
              <button
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit Branch
              </button>
            ) : (
              <>
                <button className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="save-button" onClick={handleSave}>
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
        <div className="header-actions">
          {!isEditing && (
            <>
              <Link
                to={`/branch/${id}/employee`}
                className="add-employee-button"
              >
                <i className="bi bi-person"></i>
                Employee
              </Link>
              
              <Link
                to={`/branch/${id}/products`}
                className="add-product-button "
              >
                <i className="bi bi-box-seam "></i> Products
              </Link>
              <Link
                to={`/branch/${id}/accounts`}
                className="add-account-button "
              >
                <i className="bi bi-bank2"></i> Accounts
              </Link>
              <Link to={`/branch/${id}/report`} className="add-report-button">
                <i className="bi bi-file-earmark-bar-graph"></i> Reports
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="branch-detail-content">
        <div className="detail-section">
          <h2>Branch Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Branch Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{branch.name}</p>
              )}
            </div>
            <div className="detail-item">
              <label>Branch Code</label>
              {isEditing ? (
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{branch.code}</p>
              )}
            </div>
            <div className="detail-item">
              <label>GST Number</label>
              {isEditing ? (
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{branch.gstNumber}</p>
              )}
            </div>
            <div className="detail-item">
              <label>Status</label>
              {isEditing ? (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              ) : (
                <p>{branch.status}</p>
              )}
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Address</h2>
          <div className="detail-grid">
            <div className="detail-item full-width">
              <label>Street Address</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{branch.address.street}</p>
              )}
            </div>
            <div className="detail-item">
              <label>City</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{branch.address.city}</p>
              )}
            </div>
            <div className="detail-item">
              <label>State</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{branch.address.state}</p>
              )}
            </div>
            <div className="detail-item">
              <label>Country</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{branch.address.country}</p>
              )}
            </div>
            <div className="detail-item">
              <label>Pincode</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{branch.address.pincode}</p>
              )}
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Contact Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{branch.contact.phone}</p>
              )}
            </div>
            <div className="detail-item">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{branch.contact.email}</p>
              )}
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Ownership Details</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Ownership Type</label>
              {isEditing ? (
                <select
                  name="OwnerShip"
                  value={formData.OwnerShip}
                  onChange={handleInputChange}
                >
                  <option value="Owned">Owned</option>
                  <option value="Leased">Leased</option>
                  <option value="Rented">Rented</option>
                </select>
              ) : (
                <p>{branch.OwnerShip}</p>
              )}
            </div>

            {/* Leased Details */}
            {(isEditing ? formData.OwnerShip : branch.OwnerShip) ===
              "Leased" && (
              <>
                <div className="detail-item">
                  <label>Lease Holder Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="leasedetails.leaseholdername"
                      value={formData.leasedetails?.leaseholdername || ""}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p>{branch.leasedetails?.leaseholdername || "-"}</p>
                  )}
                </div>
                <div className="detail-item">
                  <label>Contact</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="leasedetails.leaseholdercontact"
                      value={formData.leasedetails?.leaseholdercontact || ""}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p>{branch.leasedetails?.leaseholdercontact || "-"}</p>
                  )}
                </div>
                <div className="detail-item full-width">
                  <label>Address</label>
                  {isEditing ? (
                    <div className="nested-inputs">
                      <input
                        type="text"
                        name="leasedetails.leaseholderaddress.street"
                        value={
                          formData.leasedetails?.leaseholderaddress?.street ||
                          ""
                        }
                        onChange={handleInputChange}
                        placeholder="Street"
                        style={{ marginBottom: "5px" }}
                      />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input
                          type="text"
                          name="leasedetails.leaseholderaddress.city"
                          value={
                            formData.leasedetails?.leaseholderaddress?.city ||
                            ""
                          }
                          onChange={handleInputChange}
                          placeholder="City"
                        />
                        <input
                          type="text"
                          name="leasedetails.leaseholderaddress.pincode"
                          value={
                            formData.leasedetails?.leaseholderaddress
                              ?.pincode || ""
                          }
                          onChange={handleInputChange}
                          placeholder="Pincode"
                        />
                      </div>
                    </div>
                  ) : (
                    <p>
                      {branch.leasedetails?.leaseholderaddress?.street},{" "}
                      {branch.leasedetails?.leaseholderaddress?.city} -{" "}
                      {branch.leasedetails?.leaseholderaddress?.pincode}
                    </p>
                  )}
                </div>
                <div className="detail-item">
                  <label>Lease Amount</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="leasedetails.Leasedamount"
                      value={formData.leasedetails?.Leasedamount || ""}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p>{branch.leasedetails?.Leasedamount || "-"}</p>
                  )}
                </div>
                <div className="detail-item">
                  <label>Frequency</label>
                  {isEditing ? (
                    <select
                      name="leasedetails.LeasedFrequency"
                      value={
                        formData.leasedetails?.LeasedFrequency || "Monthly"
                      }
                      onChange={handleInputChange}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                      <option value="One Time">One Time</option>
                    </select>
                  ) : (
                    <p>{branch.leasedetails?.LeasedFrequency || "-"}</p>
                  )}
                </div>
                <div className="detail-item full-width">
                  <label>Lease Period</label>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="date"
                        name="leasedetails.LeasedPeriod.LeasedStartDate"
                        value={
                          formData.leasedetails?.LeasedPeriod
                            ?.LeasedStartDate || ""
                        }
                        onChange={handleInputChange}
                      />
                      <input
                        type="date"
                        name="leasedetails.LeasedPeriod.LeasedEndDate"
                        value={
                          formData.leasedetails?.LeasedPeriod?.LeasedEndDate ||
                          ""
                        }
                        onChange={handleInputChange}
                      />
                    </div>
                  ) : (
                    <p>
                      {branch.leasedetails?.LeasedPeriod?.LeasedStartDate
                        ? new Date(
                            branch.leasedetails.LeasedPeriod.LeasedStartDate
                          ).toLocaleDateString()
                        : "-"}{" "}
                      -{" "}
                      {branch.leasedetails?.LeasedPeriod?.LeasedEndDate
                        ? new Date(
                            branch.leasedetails.LeasedPeriod.LeasedEndDate
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Rented Details */}
            {(isEditing ? formData.OwnerShip : branch.OwnerShip) ===
              "Rented" && (
              <>
                <div className="detail-item">
                  <label>Rent Amount</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="rentdetails.rentamount"
                      value={formData.rentdetails?.rentamount || ""}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p>{branch.rentdetails?.rentamount || "-"}</p>
                  )}
                </div>
                <div className="detail-item">
                  <label>Frequency</label>
                  {isEditing ? (
                    <select
                      name="rentdetails.rentfrequency"
                      value={formData.rentdetails?.rentfrequency || "Monthly"}
                      onChange={handleInputChange}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  ) : (
                    <p>{branch.rentdetails?.rentfrequency || "-"}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="detail-section">
            <h2>Security</h2>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <label>Update AccessCode (Leave blank to keep current)</label>
                <input
                  type="AccessCode"
                  name="AccessCode"
                  value={formData.AccessCode || ""}
                  onChange={handleInputChange}
                  placeholder="Enter new AccessCode"
                  title="Must contain at least one uppercase, one lowercase, one number, and one special character"
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
        )}

        {/* <div className="detail-section">
          <div className="section-header">
            <h2>Branch Products</h2>
            <Link to="/products" className="view-all-link">
              View All Products →
            </Link>
          </div>
          <div className="products-grid">
            <div className="product-card">
              <div className="product-info">
                <h4>Basmati Rice</h4>
                <p className="product-category">Groceries</p>
                <p className="product-price">₹120/kg</p>
              </div>
              <div className="product-stock">
                <span className="stock-badge in-stock">In Stock</span>
                <p className="stock-quantity">250 units</p>
              </div>
            </div>

            <div className="product-card">
              <div className="product-info">
                <h4>Toor Dal</h4>
                <p className="product-category">Groceries</p>
                <p className="product-price">₹95/kg</p>
              </div>
              <div className="product-stock">
                <span className="stock-badge in-stock">In Stock</span>
                <p className="stock-quantity">180 units</p>
              </div>
            </div>

            <div className="product-card">
              <div className="product-info">
                <h4>Sunflower Oil</h4>
                <p className="product-category">Groceries</p>
                <p className="product-price">₹145/ltr</p>
              </div>
              <div className="product-stock">
                <span className="stock-badge in-stock">In Stock</span>
                <p className="stock-quantity">120 units</p>
              </div>
            </div>

            <div className="product-card">
              <div className="product-info">
                <h4>Sugar</h4>
                <p className="product-category">Groceries</p>
                <p className="product-price">₹42/kg</p>
              </div>
              <div className="product-stock">
                <span className="stock-badge low-stock">Low Stock</span>
                <p className="stock-quantity">15 units</p>
              </div>
            </div>

            <div className="product-card">
              <div className="product-info">
                <h4>Wheat Flour</h4>
                <p className="product-category">Groceries</p>
                <p className="product-price">₹38/kg</p>
              </div>
              <div className="product-stock">
                <span className="stock-badge in-stock">In Stock</span>
                <p className="stock-quantity">300 units</p>
              </div>
            </div>

            <div className="product-card">
              <div className="product-info">
                <h4>Tea Powder</h4>
                <p className="product-category">Beverages</p>
                <p className="product-price">₹280/kg</p>
              </div>
              <div className="product-stock">
                <span className="stock-badge in-stock">In Stock</span>
                <p className="stock-quantity">85 units</p>
              </div>
            </div>

            <div className="product-card">
              <div className="product-info">
                <h4>Coffee Powder</h4>
                <p className="product-category">Beverages</p>
                <p className="product-price">₹420/kg</p>
              </div>
              <div className="product-stock">
                <span className="stock-badge in-stock">In Stock</span>
                <p className="stock-quantity">60 units</p>
              </div>
            </div>

            <div className="product-card">
              <div className="product-info">
                <h4>Milk Powder</h4>
                <p className="product-category">Dairy</p>
                <p className="product-price">₹350/kg</p>
              </div>
              <div className="product-stock">
                <span className="stock-badge out-of-stock">Out of Stock</span>
                <p className="stock-quantity">0 units</p>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default BranchDetail;
