import { useState } from "react";
import { useAuth } from "../../Context/AuthContext";
import { toast } from "react-toastify";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast.error("Current password is required to save changes");
      return;
    }

    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        currentPassword: formData.currentPassword,
      };

      if (formData.email !== user.email) {
        profileData.email = formData.email;
      }

      if (formData.newPassword) {
        profileData.password = formData.newPassword;
      }

      if (!profileData.email && !profileData.password) {
        toast.info("No changes to update");
        setLoading(false);
        return;
      }

      const result = await updateProfile(profileData);

      if (result.success) {
        toast.success(result.message);
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="mb-4">
            <h1 className="h3 fw-bold text-dark mb-1">
              Admin Profile Settings
            </h1>
            <p className="text-muted">
              Update your account email and security credentials
            </p>
          </div>

          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-light border-0 p-4">
              <div className="d-flex align-items-center gap-4">
                <div
                  className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle shadow-sm"
                  style={{
                    width: "80px",
                    height: "80px",
                    fontSize: "2rem",
                    fontWeight: "bold",
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div>
                  <h2 className="h4 fw-bold mb-1">{user?.name}</h2>
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 text-uppercase"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {user?.role}
                    </span>
                    <span className="text-muted small">
                      ID: {user?.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-4 pt-2">
                  <h5 className="fw-bold mb-3 border-bottom pb-2">
                    Account Information
                  </h5>
                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label fw-semibold small text-muted"
                    >
                      Email Address
                    </label>
                    <div className="input-group shadow-sm border rounded-3 overflow-hidden">
                      <span className="input-group-text bg-white border-0 px-3">
                        <i className="bi bi-envelope-at text-muted"></i>
                      </span>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control border-0 py-2"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        style={{ backgroundColor: "#fcfcfc" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="fw-bold mb-3 border-bottom pb-2">Security</h5>

                     <div
                  className="mb-4 p-4 rounded-4"
                  style={{
                    backgroundColor: "#fff9f2",
                    border: "1px solid #ffedd5",
                  }}
                >
                  <div className="mb-0">
                    <label
                      htmlFor="currentPassword"
                      className="form-label fw-bold small text-warning-emphasis"
                    >
                      Current Password (Required to save changes)
                    </label>
                    <div className="input-group shadow-sm border rounded-3 overflow-hidden">
                      <span className="input-group-text bg-white border-0 px-3">
                        <i className="bi bi-shield-check text-warning"></i>
                      </span>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        className="form-control border-0 py-2"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter current password"
                        required
                        style={{ backgroundColor: "#ffffff" }}
                      />
                      <button
                        type="button"
                        className="btn btn-white border-0 px-3 text-muted"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        <i
                          className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"}`}
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>
                  <div className="mb-3">
                    <label
                      htmlFor="newPassword"
                      className="form-label fw-semibold small text-muted"
                    >
                      New Password (leave blank to keep current)
                    </label>
                    <div className="input-group shadow-sm border rounded-3 overflow-hidden">
                      <span className="input-group-text bg-white border-0 px-3">
                        <i className="bi bi-lock text-muted"></i>
                      </span>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        className="form-control border-0 py-2"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Minimum 6 characters"
                        style={{ backgroundColor: "#fcfcfc" }}
                      />
                      <button
                        type="button"
                        className="btn btn-white border-0 px-3 text-muted"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        <i
                          className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`}
                        ></i>
                      </button>
                    </div>
                  </div>

                  {formData.newPassword && (
                    <div className="mb-3">
                      <label
                        htmlFor="confirmPassword"
                        className="form-label fw-semibold small text-muted"
                      >
                        Confirm New Password
                      </label>
                      <div className="input-group shadow-sm border rounded-3 overflow-hidden animate__animated animate__fadeIn">
                        <span className="input-group-text bg-white border-0 px-3">
                          <i className="bi bi-shield-lock text-muted"></i>
                        </span>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          className="form-control border-0 py-2"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Repeat new password"
                          style={{ backgroundColor: "#fcfcfc" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

             

                <div className="d-grid pt-2">
                  <button
                    type="submit"
                    className="btn btn-dark btn-lg rounded-3 shadow-sm py-3 fw-bold"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Updating...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
