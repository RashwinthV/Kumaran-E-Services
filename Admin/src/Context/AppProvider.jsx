import { AuthProvider } from "./AuthContext";
import { BranchProvider } from "./BranchContext";
import { AccountProvider } from "./AccountContext";
import { ProductProvider } from "./ProductContext";
import { CustomerProvider } from "./CustomerContext";
import { BillingProvider } from "./BillingContext";

export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <CustomerProvider>
        <BranchProvider>
          <ProductProvider>
            <BillingProvider>
              <AccountProvider>{children}</AccountProvider>
            </BillingProvider>
          </ProductProvider>
        </BranchProvider>
      </CustomerProvider>
    </AuthProvider>
  );
};
