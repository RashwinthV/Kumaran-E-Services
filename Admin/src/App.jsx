import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Pages
import Login from "./Pages/User/Login";
import Dashboard from "./Pages/Dashboard";
import Branch from "./Pages/Branch/Branch";
import BranchDetail from "./Pages/Branch/BranchDetail";
import Products from "./Pages/Products";
import ProductDetails from "./Pages/ProductDetails";
import Profile from "./Pages/User/Profile";

// Components
import SidebarNav from "./Components/Navigation/SidebarNav";
import LoadingPage from "./Components/Loading/LoadingPage";
import UniversalLoader from "./Components/Loading/UniversalLoader";
import Header from "./Components/Header";
import Footer from "./Components/Footer";
// import AddEmployee from "./Components/Employee/AddEmployee";
import Employee from "./Pages/Branch/Employee";
import ProtectedRoute from "./Modals/ProtectedRoute";
import BranchProducts from "./Pages/Branch/BranchProducts";
import AccountManagement from "./Pages/Branch/Accounts";
import BranchAccountDetail from "./Pages/Branch/BranchAccountDetail";
import { useAuth } from "./Context/AuthContext";

// Protected Route Component (fixed)

import ScrollToTop from "./Components/ScrollToTop";
import Reports from "./Pages/Reports";
import BranchReport from "./Pages/Branch/BranchReport";
import Customer from "./Pages/Customer";
import Investors from "./Pages/Investors";
import InvestorDetailsPage from "./Pages/InvestorDetailsPage";
import AddInvestor from "./Pages/AddInvestor";
import InvestorHistory from "./Pages/InvestorHistory";

// Layout wrapper to conditionally show Header and Sidebar
const Layout = ({ children }) => {
  const location = useLocation();
  const { loading } = useAuth();
  const noHeaderRoutes = ["/", "/login", "/register"];

  const hideHeader = noHeaderRoutes.includes(location.pathname);

  // Show global loader for all pages EXCEPT the root loading page and login
  if (loading && !hideHeader) {
    return (
      <UniversalLoader
        title="Initializing..."
        message="Checking authentication..."
        status="checking"
      />
    );
  }

  if (hideHeader) {
    return <div className="main-content">{children}</div>;
  }

  return (
    <div className="app-container">
      <div className="app-main-layout">
        <SidebarNav />
        <div className="main-content-area">
          <Header />
          <div className="content-viewport">{children}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

function AppContent() {
  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <ToastContainer position="top-right" autoClose={3000} theme="light" />

        <Routes>
          {/* Public */}
          <Route path="/" element={<LoadingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Brabch Routes */}
            <Route path="/branch" element={<Branch />} />
            <Route path="/branch/:id" element={<BranchDetail />} />

            {/* Employee route */}
            <Route path="/branch/:id/employee" element={<Employee />} />

            {/* Report route */}
            <Route path="/branch/:id/report" element={<BranchReport />} />

            {/* product Route */}
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/branch/:id/products" element={<BranchProducts />} />
            <Route path="/report" element={<Reports />} />
            <Route path="/customers" element={<Customer />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/investors" element={<Investors />} />
            <Route path="/investor/add" element={<AddInvestor />} />
            <Route path="/investor/history" element={<InvestorHistory />} />
            <Route path="/investor/:id" element={<InvestorDetailsPage />} />

            {/* Accounts Route */}
            <Route
              path="/branch/:id/accounts"
              element={<BranchAccountDetail />}
            />
            <Route path="/accounts" element={<AccountManagement />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <>
      <GlobalScrollFix />
      <AppContent />
    </>
  );
}

const GlobalScrollFix = () => {
  useEffect(() => {
    const handleWheel = () => {
      if (document.activeElement.type === "number") {
        document.activeElement.blur();
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return null;
};

export default App;
