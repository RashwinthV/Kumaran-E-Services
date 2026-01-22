import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Pages
import Login from "./Pages/User/Login";
import BranchLogin from "./Pages/Branch/BranchLogin";
import ProductBilling from "./Pages/Billing/ProductBilling";
import ServiceBilling from "./Pages/Billing/ServiceBilling";
import Loader from "./Components/Loading/universalLoader";
import LoadingPage from "./Components/Loading/LoadingPage";

// Components
import SidebarNav from "./Components/Navigation/SidebarNav";
import ScrollToTop from "./Components/ScrollToTop";

// Context
import { useAuth } from "./Context/AuthContext";
import Settings from "./Pages/Branch/Settings";
import ProductsCatalog from "./Pages/Branch/ProductsCatalog";

// Protected Route Component
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Footer
import Footer from "./Components/Footer";
import GlobalHeader from "./Components/Navigation/GlobalHeader";

// Layout wrapper to conditionally show Header and Sidebar
const Layout = ({ children }) => {
  const location = useLocation();
  const noHeaderRoutes = ["/", "/login", "/register", "/branch-login"];

  const hideHeader = noHeaderRoutes.includes(location.pathname);

  // If we should hide the header, we just return the children (login pages)
  if (hideHeader) {
    return <div className="main-content">{children}</div>;
  }

  const isBillingPage = location.pathname === "/billing";

  // Otherwise, return the full app layout with Sidebar, Header
  return (
    <div className="app-container">
      <div className="app-main-layout">
        <SidebarNav />
        <div
          className={`main-content-area ${
            isBillingPage || location.pathname === "/service-billing"
              ? "overflow-hidden h-100"
              : ""
          }`}
        >
          <GlobalHeader />
          <div className="content-viewport">{children}</div>
          {!isBillingPage && location.pathname !== "/service-billing" && (
            <Footer />
          )}
        </div>
      </div>
    </div>
  );
};

// Hooks
import useGlobalShortcuts from "./hooks/useGlobalShortcuts";
import SaleHistory from "./Pages/Branch/SaleHistory";
import Investors from "./Pages/Branch/Investors";
import Customer from "./Pages/Branch/Customer";
import Expenses from "./Pages/Branch/Expenses";

function GlobalKeyboardListener() {
  useGlobalShortcuts();
  return null;
}

function AppContent() {
  return (
    <Router>
      <GlobalKeyboardListener />
      <ScrollToTop />
      <Layout>
        <ToastContainer position="top-center" autoClose={3000} />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoadingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/branch-login" element={<BranchLogin />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/billing" element={<ProductBilling />} />
            <Route path="/service-billing" element={<ServiceBilling />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/product-catalog" element={<ProductsCatalog />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/customers" element={<Customer />} />
            <Route path="/sale-history" element={<SaleHistory />} />
            <Route path="/expenses" element={<Expenses />} />

            {/* Add more protected routes here */}
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
    const handleWheel = (e) => {
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
