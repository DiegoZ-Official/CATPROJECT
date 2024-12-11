import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageOrders.css'; // Add CSS for styling

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); // Loading state

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5001/manage-orders', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setOrders(res.data);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Failed to fetch orders.');
            } finally {
                setLoading(false); // End loading state
            }
        };

        fetchOrders();
    }, []);

    const handleCompleteOrder = async (orderID) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5001/complete-order',
                { OrderID: orderID },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Order marked as completed!');
            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order.OrderID === orderID
                        ? { ...order, Status: 'completed', WorkEndDate: new Date().toISOString().split('T')[0] }
                        : order
                )
            );
        } catch (err) {
            alert('Failed to mark the order as completed.');
            console.error('Error completing order:', err); // Debug error
        }
    };

    if (loading) {
        return <p>Loading orders...</p>;
    }

    return (
        <div className="manage-orders-container">
            <h2>Manage Orders</h2>
            {error && <p className="error">{error}</p>}
            {orders.length === 0 ? (
                <p>No orders to manage.</p>
            ) : (
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Quote ID</th>
                            <th>Work Start Date</th>
                            <th>Work End Date</th>
                            <th>Agreed Price</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.OrderID}>
                                <td>{order.OrderID}</td>
                                <td>{order.QuoteID}</td>
                                <td>{order.WorkStartDate || 'N/A'}</td>
                                <td>{order.WorkEndDate || 'N/A'}</td>
                                <td>${order.AgreedPrice || 'N/A'}</td>
                                <td>{order.Status}</td>
                                <td>
                                    <button
                                        className={`complete-button ${
                                            order.Status === 'completed' ? 'disabled' : ''
                                        }`}
                                        onClick={() => handleCompleteOrder(order.OrderID)}
                                        disabled={order.Status === 'completed'}
                                    >
                                        {order.Status === 'completed' ? 'Completed' : 'Mark as Completed'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ManageOrders;
