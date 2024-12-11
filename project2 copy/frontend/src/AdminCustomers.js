import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminCustomers.css'; // Create a CSS file for styling

const AdminCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5001/admin/customers', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCustomers(res.data);
            } catch (err) {
                console.error('Error fetching customers:', err);
                setError('Failed to fetch customers. Please try again.');
            }
        };

        fetchCustomers();
    }, []);

    return (
        <div className="admin-customers-container">
            <h2>All Customers</h2>
            {error && <p className="error-message">{error}</p>}
            {customers.length === 0 ? (
                <p>No customers found.</p>
            ) : (
                <table className="customers-table">
                    <thead>
                        <tr>
                            <th>Client ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Address</th>
                            <th>Credit Card Info</th>
                            <th>Phone Number</th>
                            <th>Email</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.ClientID}>
                                <td>{customer.ClientID}</td>
                                <td>{customer.FirstName || 'N/A'}</td>
                                <td>{customer.LastName || 'N/A'}</td>
                                <td>{customer.Address || 'N/A'}</td>
                                <td>{customer.CreditCardInfo || 'N/A'}</td>
                                <td>{customer.PhoneNumber || 'N/A'}</td>
                                <td>{customer.Email || 'N/A'}</td>
                                <td>{customer.Role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminCustomers;
