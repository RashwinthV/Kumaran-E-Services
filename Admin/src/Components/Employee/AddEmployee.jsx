// import { useState, useEffect } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import { toast } from "react-toastify";
// import axios from "axios";
// import "../../Styles/AddEmployee.css";
// import { useAuth } from "../../Context/AuthContext";
// import { useBranch } from "../../Context/BranchContext";

// const AddEmployee = () => {
//   const { id } = useParams(); // Branch ID
//   const navigate = useNavigate();
//   const [branch, setBranch] = useState(null);
//   const { branches, getBranches } = useBranch();

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     age: "",
//     password: "",
//     confirmPassword: "",
//     role: "staff",
//     branchId: id,
//     branchCode: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const baseURL = `${import.meta.env.VITE_BACKEND_BASE_URI}/admin`;
//   const { accessToken, user } = useAuth();
//   const userId = user.id;

//   // Fetch branch data on component mount
//   useEffect(() => {
//     if (!accessToken) return;

//     if (branches.length > 0) {
//       const foundBranch = branches.find((b) => b._id === id);
//       if (foundBranch) {
//         setBranch(foundBranch);
//         setFormData((prev) => ({
//           ...prev,
//           branchCode: foundBranch.code,
//           branchId: foundBranch._id,
//         }));
//       } else {
//         navigate("/employee");
//       }
//     } else {
//       getBranches();
//     }
//   }, [id, branches, accessToken, getBranches, navigate]);

//   // Password strength checker
//   const [passwordStrength, setPasswordStrength] = useState({
//     minLength: false,
//     hasUppercase: false,
//     hasLowercase: false,
//     hasNumber: false,
//     hasSpecialChar: false,
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setFormData({
//       ...formData,
//       [name]: value,
//     });

//     // Check password strength in real-time
//     if (name === "password") {
//       setPasswordStrength({
//         minLength: value.length >= 8,
//         hasUppercase: /[A-Z]/.test(value),
//         hasLowercase: /[a-z]/.test(value),
//         hasNumber: /\d/.test(value),
//         hasSpecialChar: /[@$!%*?&]/.test(value),
//       });
//     }
//   };

//   const validatePassword = () => {
//     const { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar } =
//       passwordStrength;

//     if (!minLength) {
//       toast.error("Password must be at least 8 characters");
//       return false;
//     }
//     if (!hasUppercase) {
//       toast.error("Password must contain at least 1 uppercase letter");
//       return false;
//     }
//     if (!hasLowercase) {
//       toast.error("Password must contain at least 1 lowercase letter");
//       return false;
//     }
//     if (!hasNumber) {
//       toast.error("Password must contain at least 1 number");
//       return false;
//     }
//     if (!hasSpecialChar) {
//       toast.error(
//         "Password must contain at least 1 special character (@$!%*?&)"
//       );
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validation
//     if (
//       !formData.name ||
//       !formData.email ||
//       !formData.phone ||
//       !formData.age ||
//       !formData.password ||
//       !formData.confirmPassword
//     ) {
//       toast.error("Please fill in all fields");
//       return;
//     }

//     if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       toast.error("Please enter a valid email address");
//       return;
//     }

//     if (!/^[0-9]{10}$/.test(formData.phone)) {
//       toast.error("Please enter a valid 10-digit phone number");
//       return;
//     }

//     const ageNum = parseInt(formData.age);
//     if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
//       toast.error("Please enter a valid age between 18 and 100");
//       return;
//     }

//     if (!validatePassword()) {
//       return;
//     }

//     if (formData.password !== formData.confirmPassword) {
//       toast.error("Passwords do not match");
//       return;
//     }

//     setLoading(true);

//     try {
//       const result = await axios.post(
//         `${baseURL}/registeremployee/${userId}`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       if (result.data.success) {
//         toast.success("Employee registered successfully!");

//         // Redirect back to branch detail page
//         setTimeout(() => {
//           navigate(`/branch/${id}/employee`);
//         }, 1500);
//       }
//     } catch (error) {
//       console.error("Registration error:", error);
//       toast.error(
//         error.response?.data?.message || "An error occurred. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!branch) return null;

//   return (
//     <div className="add-employee-container">
//       <div className="add-employee-content">
//         <div className="add-employee-card">
//           <div className="add-employee-header">
//             <Link to={`/branch/${id}/employee`} className="back-button">
//               <i className="bi bi-arrow-left"></i>
//               Back to Employee
//             </Link>
//             <div className="header-title">
//               <div className="logo-icon">
//                 <i className="bi bi-person-plus-fill"></i>
//               </div>
//               <h1>Add New Employee</h1>
//             </div>
//             <p className="subtitle">
//               Register a new staff member for {branch.name} ({branch.code})
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="employee-form">
//             <div className="form-row">
//               <div className="form-group">
//                 <label htmlFor="name">
//                   <i className="bi bi-person-fill"></i>
//                   Full Name
//                 </label>
//                 <input
//                   type="text"
//                   id="name"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   placeholder="Enter full name"
//                   required
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="role">
//                   <i className="bi bi-person-badge-fill"></i>
//                   Role
//                 </label>
//                 <select
//                   id="role"
//                   name="role"
//                   value={formData.role}
//                   onChange={handleChange}
//                   required
//                 >
//                   <option value="staff">Staff</option>
//                   <option value="manager">Manager</option>
//                 </select>
//               </div>
//             </div>

//             <div className="form-row">
//               <div className="form-group">
//                 <label htmlFor="email">
//                   <i className="bi bi-envelope-fill"></i>
//                   Email Address
//                 </label>
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   placeholder="Enter email"
//                   required
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="phone">
//                   <i className="bi bi-telephone-fill"></i>
//                   Phone Number
//                 </label>
//                 <input
//                   type="tel"
//                   id="phone"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   placeholder="10-digit phone number"
//                   required
//                   maxLength="10"
//                   pattern="[0-9]{10}"
//                 />
//               </div>
//             </div>

//             {/* Full Width Age Field */}
//             <div className="form-group full-width">
//               <label htmlFor="age">
//                 <i className="bi bi-calendar-check-fill"></i>
//                 Age
//               </label>
//               <input
//                 type="number"
//                 id="age"
//                 name="age"
//                 value={formData.age}
//                 onChange={handleChange}
//                 placeholder="Enter age (18-100)"
//                 required
//                 min="18"
//                 max="100"
//               />
//             </div>

//             <div className="form-row">
//               <div className="form-group">
//                 <label htmlFor="password">
//                   <i className="bi bi-lock-fill"></i>
//                   Password
//                 </label>
//                 <div className="password-input-wrapper">
//                   <input
//                     type={showPassword ? "text" : "password"}
//                     id="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     placeholder="Create a strong password"
//                     required
//                   />
//                   <button
//                     type="button"
//                     className="password-toggle"
//                     onClick={() => setShowPassword(!showPassword)}
//                   >
//                     <i
//                       className={
//                         showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"
//                       }
//                     ></i>
//                   </button>
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label htmlFor="confirmPassword">
//                   <i className="bi bi-lock-fill"></i>
//                   Confirm Password
//                 </label>
//                 <div className="password-input-wrapper">
//                   <input
//                     type={showConfirmPassword ? "text" : "password"}
//                     id="confirmPassword"
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleChange}
//                     placeholder="Confirm password"
//                     required
//                   />
//                   <button
//                     type="button"
//                     className="password-toggle"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   >
//                     <i
//                       className={
//                         showConfirmPassword
//                           ? "bi bi-eye-slash-fill"
//                           : "bi bi-eye-fill"
//                       }
//                     ></i>
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Password Strength Indicator */}
//             {formData.password && (
//               <div className="password-requirements">
//                 <p className="requirements-title">Password must contain:</p>
//                 <ul className="requirements-list">
//                   <li className={passwordStrength.minLength ? "met" : ""}>
//                     <span className="check-icon">
//                       <i
//                         className={
//                           passwordStrength.minLength
//                             ? "bi bi-check-circle-fill"
//                             : "bi bi-circle"
//                         }
//                       ></i>
//                     </span>
//                     At least 8 characters
//                   </li>
//                   <li className={passwordStrength.hasUppercase ? "met" : ""}>
//                     <span className="check-icon">
//                       <i
//                         className={
//                           passwordStrength.hasUppercase
//                             ? "bi bi-check-circle-fill"
//                             : "bi bi-circle"
//                         }
//                       ></i>
//                     </span>
//                     One uppercase letter (A-Z)
//                   </li>
//                   <li className={passwordStrength.hasLowercase ? "met" : ""}>
//                     <span className="check-icon">
//                       <i
//                         className={
//                           passwordStrength.hasLowercase
//                             ? "bi bi-check-circle-fill"
//                             : "bi bi-circle"
//                         }
//                       ></i>
//                     </span>
//                     One lowercase letter (a-z)
//                   </li>
//                   <li className={passwordStrength.hasNumber ? "met" : ""}>
//                     <span className="check-icon">
//                       <i
//                         className={
//                           passwordStrength.hasNumber
//                             ? "bi bi-check-circle-fill"
//                             : "bi bi-circle"
//                         }
//                       ></i>
//                     </span>
//                     One number (0-9)
//                   </li>
//                   <li className={passwordStrength.hasSpecialChar ? "met" : ""}>
//                     <span className="check-icon">
//                       <i
//                         className={
//                           passwordStrength.hasSpecialChar
//                             ? "bi bi-check-circle-fill"
//                             : "bi bi-circle"
//                         }
//                       ></i>
//                     </span>
//                     One special character (@$!%*?&)
//                   </li>
//                 </ul>
//               </div>
//             )}

//             <div className="form-actions">
//               <button
//                 type="button"
//                 className="cancel-btn"
//                 onClick={() => navigate(`/branch/${id}`)}
//               >
//                 <i className="bi bi-x-circle-fill"></i>
//                 Cancel
//               </button>
//               <button type="submit" className="submit-btn" disabled={loading}>
//                 {loading ? (
//                   <>
//                     <span className="spinner"></span>
//                     Adding Employee...
//                   </>
//                 ) : (
//                   <>
//                     <i className="bi bi-person-plus-fill"></i>
//                     Add Employee
//                   </>
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddEmployee;

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import "../../Styles/AddEmployee.css"; // New CSS file for modal
import { useAuth } from "../../Context/AuthContext";
import { useBranch } from "../../Context/BranchContext";

const AddEmployeeModal = ({
  isOpen,
  onClose,
  branchId,
  onSuccess,
  employeeToEdit,
}) => {
  const [branch, setBranch] = useState(null);
  const { branches, getBranches } = useBranch();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    password: "",
    confirmPassword: "",
    role: "staff",
    branchId: branchId,
    branchCode: "",
    PayPerDay: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const baseURL = `${import.meta.env.VITE_BACKEND_BASE_URI}/admin`;
  const { accessToken, user } = useAuth();
  const userId = user.id;

  // Initialize form when opening
  useEffect(() => {
    if (!accessToken || !isOpen) return;

    // Set branch info
    if (branches.length > 0) {
      const foundBranch = branches.find((b) => b._id === branchId);
      if (foundBranch) {
        setBranch(foundBranch);
        // Initial form setup (will be overridden if editing)
        setFormData((prev) => ({
          ...prev,
          branchCode: foundBranch.code,
          branchId: foundBranch._id,
        }));
      }
    } else {
      getBranches();
    }

    // Pre-fill if editing
    if (employeeToEdit) {
      setFormData({
        name: employeeToEdit.name || "",
        email: employeeToEdit.email || "",
        phone: employeeToEdit.phone || "",
        age: employeeToEdit.age || "",
        role: employeeToEdit.role || "staff",
        branchId: branchId,
        branchCode: employeeToEdit.branchCode || "",
        PayPerDay: employeeToEdit.PayPerDay || "",
        password: "", // Don't pre-fill password
        confirmPassword: "",
      });
    } else {
      // Reset if adding new
      setFormData({
        name: "",
        email: "",
        phone: "",
        age: "",
        password: "",
        confirmPassword: "",
        role: "staff",
        branchId: branchId,
        branchCode: branch?.code || "", // fallback if branch not set yet
        PayPerDay: "",
      });
    }
  }, [branchId, branches, accessToken, getBranches, isOpen, employeeToEdit]);

  // Password strength checker
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Check password strength in real-time
    if (name === "password") {
      setPasswordStrength({
        minLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSpecialChar: /[@$!%*?&]/.test(value),
      });
    }
  };

  const validatePassword = () => {
    // Skip password validation if editing and password field is empty
    if (employeeToEdit && !formData.password) return true;

    const { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar } =
      passwordStrength;

    if (!minLength) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (!hasUppercase) {
      toast.error("Password must contain at least 1 uppercase letter");
      return false;
    }
    if (!hasLowercase) {
      toast.error("Password must contain at least 1 lowercase letter");
      return false;
    }
    if (!hasNumber) {
      toast.error("Password must contain at least 1 number");
      return false;
    }
    if (!hasSpecialChar) {
      toast.error(
        "Password must contain at least 1 special character (@$!%*?&)",
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.age) {
      toast.error("Please fill in all details fields");
      return;
    }

    // Password required only for new employees
    if (!employeeToEdit && (!formData.password || !formData.confirmPassword)) {
      toast.error("Password is required for new employees");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      toast.error("Please enter a valid age between 18 and 100");
      return;
    }

    // Validate password only if provided (or required)
    if (formData.password && !validatePassword()) {
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      let result;
      if (employeeToEdit) {
        // Update existing employee
        result = await axios.put(
          `${baseURL}/employees/${employeeToEdit._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
      } else {
        // Register new employee
        result = await axios.post(
          `${baseURL}/registeremployee/${userId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
      }

      if (result.data.success) {
        toast.success(
          employeeToEdit
            ? "Employee updated successfully!"
            : "Employee registered successfully!",
        );
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Operation error:", error);
      toast.error(
        error.response?.data?.message || "An error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !branch) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <div className="logo-icon">
              <i
                className={`bi ${
                  employeeToEdit ? "bi-pencil-square" : "bi-person-plus-fill"
                }`}
              ></i>
            </div>
            <h2>{employeeToEdit ? "Edit Employee" : "Add New Employee"}</h2>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <p className="modal-subtitle">
          {employeeToEdit
            ? `Update details for ${employeeToEdit.name}`
            : `Register a new staff member for ${branch.name} (${branch.code})`}
        </p>

        <form onSubmit={handleSubmit} className="employee-form-modal">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">
                <i className="bi bi-person-fill"></i>
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">
                <i className="bi bi-person-badge-fill"></i>
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">
                <i className="bi bi-envelope-fill"></i>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                <i className="bi bi-telephone-fill"></i>
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                required
                maxLength="10"
                pattern="[0-9]{10}"
              />
            </div>
          </div>

          {/* Full Width Age Field */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">
                <i className="bi bi-calendar-check-fill"></i>
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter age (18-100)"
                required
                min="18"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="PayPerDay">
                <i className="bi bi-currency-rupee"></i>
                Pay Per Day
              </label>
              <input
                type="number"
                id="PayPerDay"
                name="PayPerDay"
                value={formData.PayPerDay}
                onChange={handleChange}
                placeholder="Enter monthly salary"
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">
                <i className="bi bi-lock-fill"></i>
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={
                    employeeToEdit
                      ? "Leave blank to keep current password"
                      : "Create a strong password"
                  }
                  required={!employeeToEdit}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i
                    className={
                      showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"
                    }
                  ></i>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <i className="bi bi-lock-fill"></i>
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  required={!employeeToEdit && !!formData.password} // Required if adding new OR if password field has value during edit
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i
                    className={
                      showConfirmPassword
                        ? "bi bi-eye-slash-fill"
                        : "bi bi-eye-fill"
                    }
                  ></i>
                </button>
              </div>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="password-requirements">
              <p className="requirements-title">Password must contain:</p>
              <ul className="requirements-list">
                <li className={passwordStrength.minLength ? "met" : ""}>
                  <span className="check-icon">
                    <i
                      className={
                        passwordStrength.minLength
                          ? "bi bi-check-circle-fill"
                          : "bi bi-circle"
                      }
                    ></i>
                  </span>
                  At least 8 characters
                </li>
                <li className={passwordStrength.hasUppercase ? "met" : ""}>
                  <span className="check-icon">
                    <i
                      className={
                        passwordStrength.hasUppercase
                          ? "bi bi-check-circle-fill"
                          : "bi bi-circle"
                      }
                    ></i>
                  </span>
                  One uppercase letter (A-Z)
                </li>
                <li className={passwordStrength.hasLowercase ? "met" : ""}>
                  <span className="check-icon">
                    <i
                      className={
                        passwordStrength.hasLowercase
                          ? "bi bi-check-circle-fill"
                          : "bi bi-circle"
                      }
                    ></i>
                  </span>
                  One lowercase letter (a-z)
                </li>
                <li className={passwordStrength.hasNumber ? "met" : ""}>
                  <span className="check-icon">
                    <i
                      className={
                        passwordStrength.hasNumber
                          ? "bi bi-check-circle-fill"
                          : "bi bi-circle"
                      }
                    ></i>
                  </span>
                  One number (0-9)
                </li>
                <li className={passwordStrength.hasSpecialChar ? "met" : ""}>
                  <span className="check-icon">
                    <i
                      className={
                        passwordStrength.hasSpecialChar
                          ? "bi bi-check-circle-fill"
                          : "bi bi-circle"
                      }
                    ></i>
                  </span>
                  One special character (@$!%*?&)
                </li>
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              <i className="bi bi-x-circle-fill"></i>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {employeeToEdit
                    ? "Updating Employee..."
                    : "Adding Employee..."}
                </>
              ) : (
                <>
                  <i
                    className={`bi ${
                      employeeToEdit
                        ? "bi-check-circle-fill"
                        : "bi-person-plus-fill"
                    }`}
                  ></i>
                  {employeeToEdit ? "Update Employee" : "Add Employee"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
