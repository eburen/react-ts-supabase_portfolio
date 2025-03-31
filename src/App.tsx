import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';

// Pages to be created later
const HomePage = () => <div className="min-h-screen bg-gray-50 p-8">Home Page Coming Soon</div>;
const ShopPage = () => <div className="min-h-screen bg-gray-50 p-8">Shop Page Coming Soon</div>;
const ProductPage = () => <div className="min-h-screen bg-gray-50 p-8">Product Details Coming Soon</div>;
const CartPage = () => <div className="min-h-screen bg-gray-50 p-8">Cart Page Coming Soon</div>;
const CheckoutPage = () => <div className="min-h-screen bg-gray-50 p-8">Checkout Page Coming Soon</div>;
const LoginPage = () => <div className="min-h-screen bg-gray-50 p-8">Login Page Coming Soon</div>;
const RegisterPage = () => <div className="min-h-screen bg-gray-50 p-8">Register Page Coming Soon</div>;
const DashboardPage = () => <div className="min-h-screen bg-gray-50 p-8">Admin Dashboard Coming Soon</div>;
const NotFoundPage = () => <div className="min-h-screen bg-gray-50 p-8">404 - Page Not Found</div>;

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin route component
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <DashboardPage />
              </AdminRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center">© {new Date().getFullYear()} E-Store. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
