import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const token = localStorage.getItem('token'); // Check if the user is logged in

  return (
    <div className="container">
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>Welcome to the Clients Management System</h1>
        <nav>
          <ul style={{ listStyleType: 'none', padding: '0', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            {token && <li><Link to="/dashboard">Dashboard</Link></li>}
          </ul>
        </nav>
      </header>

      {/* Project Overview */}
      <main>
        <section>
          <h2>About This Project</h2>
          <p>
            This project demonstrates a robust client management system using a JWT-based authentication flow.
            The system allows for secure login, registration, and access to protected client information.
          </p>
          <ul>
            <li>Secure user authentication using JSON Web Tokens (JWT).</li>
            <li>Comprehensive management of client data including contact details, quotes, and orders.</li>
            <li>Seamless navigation with protected routes for authenticated users.</li>
          </ul>
        </section>

        {/* JWT Explanation */}
        <section>
          <h2>What is JSON Web Token (JWT)?</h2>
          <p>
            JWT is a compact, URL-safe token used to securely transmit information between parties. It is commonly used in modern web applications for authentication and information exchange.
          </p>
          <p>A JWT consists of three parts:</p>
          <ul>
            <li><strong>Header:</strong> Contains metadata about the token, such as the algorithm used.</li>
            <li><strong>Payload:</strong> Contains the claims or data being transmitted.</li>
            <li><strong>Signature:</strong> Ensures the integrity of the token and validates its authenticity.</li>
          </ul>
        </section>

        {/* Footer */}
        <footer>
          <p>&copy; 2024 Clients Management System. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default HomePage;