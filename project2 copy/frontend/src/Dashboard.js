import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.Role === 'admin') {
          setIsAdmin(true);
        }
        setEmail(res.data.Email);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setIsAdmin(false);
      }
    };
    fetchUserDetails();
  }, []);

  // Log out function to clear the token and redirect to the home page
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the JWT token
    navigate('/'); // Redirect to the home page
  };

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', color: '#007bff', textAlign: 'center', marginBottom: '20px' }}>Dashboard</h2>
      
      <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#555' }}>
        Logged in as: <strong>{email}</strong>
      </p>

      {/* Menu */}
      <nav style={{ textAlign: 'center', marginBottom: '20px' }}>
        <ul style={{ listStyleType: 'none', padding: '0', display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center' }}>
          <li>
            <Link to="/" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff', padding: '10px 20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/profile" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff', padding: '10px 20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              Profile
            </Link>
          </li>
          <li>
            <Link to="/request-quote" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff', padding: '10px 20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              Request a Quote
            </Link>
          </li>
          <li>
            <Link to="/user-quotes" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff', padding: '10px 20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              View Quotes
            </Link>
          </li>
          <li>
            <Link to="/view-bills" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff', padding: '10px 20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              View Bills
            </Link>
          </li>
          {isAdmin && (
              <>
                  <li>
                      <Link
                          to="/manage-requests"
                          style={{
                              textDecoration: 'none',
                              fontSize: '1.2rem',
                              color: 'white',
                              padding: '10px 20px',
                              backgroundColor: '#007bff',
                              borderRadius: '4px',
                          }}
                      >
                          Manage Requests
                      </Link>
                  </li>
                  <li>
                      <Link
                          to="/manage-bills"
                          style={{
                              textDecoration: 'none',
                              fontSize: '1.2rem',
                              color: 'white',
                              padding: '10px 20px',
                              backgroundColor: '#007bff',
                              borderRadius: '4px',
                          }}
                      >
                          Manage Bills
                      </Link>
                  </li>
                  <li>
                      <Link
                          to="/manage-orders"
                          style={{
                              textDecoration: 'none',
                              fontSize: '1.2rem',
                              color: 'white',
                              padding: '10px 20px',
                              backgroundColor: '#007bff',
                              borderRadius: '4px',
                          }}
                      >
                          Manage Orders
                      </Link>
                  </li>
                  <li>
                      <Link
                          to="/admin/customers"
                          style={{
                              textDecoration: 'none',
                              fontSize: '1.2rem',
                              color: 'white',
                              padding: '10px 20px',
                              backgroundColor: '#007bff',
                              borderRadius: '4px',
                          }}
                      >
                          View All Customers
                      </Link>
                  </li>
              </>
          )}
          <li>
            <button
              onClick={handleLogout}
              style={{
                fontSize: '1.2rem',
                color: '#007bff',
                backgroundColor: '#f5f5f5',
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify', marginBottom: '20px' }}>
        Welcome to the dashboard. You are successfully logged in. This dashboard allows you to navigate to other private pages like the Profile page, Request a Quote page, and View Quotes page.
      </p>

      <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify' }}>
        Please note that if you are not logged in and attempt to access this dashboard directly by entering the URL 
        <strong> http://localhost:3000/dashboard </strong> in your browser, you will be redirected to the login page. 
        This is because the website checks for a valid **JWT token** before granting access to private pages like the dashboard.
      </p>
    </div>
  );
};

export default Dashboard;
