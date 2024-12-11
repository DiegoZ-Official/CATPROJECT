import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Profile from './Profile';
import UserQuotes from './UserQuotes';
import PrivateRoute from './PrivateRoute';
import ManageRequests from './ManageRequests';
import RequestAQuote from './RequestQuote';
import ManageBills from './ManageBills';
import ManageOrders from './ManageOrders';
import ViewBills from './ViewBills';
import AdminCustomers from './AdminCustomers'; 

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/user-quotes"
                    element={
                        <PrivateRoute>
                            <UserQuotes />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manage-requests"
                    element={
                        <PrivateRoute>
                            <ManageRequests />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/request-quote"
                    element={
                        <PrivateRoute>
                            <RequestAQuote />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manage-bills"
                    element={
                        <PrivateRoute>
                            <ManageBills />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manage-orders"
                    element={
                        <PrivateRoute>
                            <ManageOrders />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/view-bills"
                    element={
                        <PrivateRoute>
                            <ViewBills />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/customers"
                    element={
                        <PrivateRoute>
                            <AdminCustomers />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
