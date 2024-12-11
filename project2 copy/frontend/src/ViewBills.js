import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManageBills.css';

const ViewBills = () => {
    const [bills, setBills] = useState([]);
    const [error, setError] = useState('');
    const [counterOffer, setCounterOffer] = useState('');
    const [message, setMessage] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [creditCardInfo, setCreditCardInfo] = useState('');

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5001/view-bills', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setBills(res.data);
            } catch (err) {
                setError('Failed to fetch bills. Please try again.');
            }
        };

        fetchBills();
    }, []);

    const handlePayBill = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5001/pay-bill',
                { BillID: selectedBill.BillID, CreditCardInfo: creditCardInfo },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(response.data.message);
            setBills((prevBills) =>
                prevBills.map((bill) =>
                    bill.BillID === selectedBill.BillID
                        ? { ...bill, Status: 'paid', PayDate: new Date().toISOString().split('T')[0] }
                        : bill
                )
            );
            setShowPaymentModal(false);
        } catch (err) {
            console.error('Error in paying bill:', err.response?.data || err);
            alert('Failed to pay the bill. Please try again.');
        }
    };
    

    const openPaymentModal = async (bill) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5001/get-credit-card`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCreditCardInfo(res.data.CreditCardInfo || '');
            setSelectedBill(bill);
            setShowPaymentModal(true);
        } catch (err) {
            alert('Failed to fetch credit card information.');
        }
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedBill(null);
        setCreditCardInfo('');
    };

    const handleCounterOffer = async (billID) => {
        if (!counterOffer) {
            alert('Please enter a counter offer.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5001/counter-bill',
                { BillID: billID, CounterOffer: counterOffer, Message: message },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Counter offer submitted successfully!');
            setCounterOffer('');
            setMessage('');
            setBills((prevBills) =>
                prevBills.map((bill) =>
                    bill.BillID === billID
                        ? { ...bill, Status: 'disputed' }
                        : bill
                )
            );
        } catch (err) {
            alert('Failed to submit counter offer. Please try again.');
        }
    };

    return (
        <div className="manage-bills-container">
            <h2>Your Bills</h2>
            {error && <p className="error-message">{error}</p>}
            {bills.length === 0 ? (
                <p>No bills found.</p>
            ) : (
                <table className="bills-table">
                    <thead>
                        <tr>
                            <th>Bill ID</th>
                            <th>Order ID</th>
                            <th>Bill Date</th>
                            <th>Amount Due</th>
                            <th>Pay Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.map((bill) => (
                            <tr key={bill.BillID}>
                                <td>{bill.BillID}</td>
                                <td>{bill.OrderID}</td>
                                <td>{bill.BillDate ? new Date(bill.BillDate).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    {bill.AmountDue !== null
                                        ? `$${Number(bill.AmountDue).toFixed(2)}`
                                        : 'N/A'}
                                </td>
                                <td>{bill.PayDate ? new Date(bill.PayDate).toLocaleDateString() : 'N/A'}</td>
                                <td>{bill.Status}</td>
                                <td>
                                    {bill.Status === 'waiting for client' ? (
                                        <>
                                            <button
                                                onClick={() => openPaymentModal(bill)}
                                                className="complete-button"
                                            >
                                                Pay Bill
                                            </button>
                                            <div style={{ marginTop: '10px' }}>
                                                <input
                                                    type="number"
                                                    placeholder="Enter counter offer"
                                                    value={counterOffer}
                                                    onChange={(e) => setCounterOffer(e.target.value)}
                                                    style={{
                                                        padding: '5px',
                                                        marginRight: '5px',
                                                        width: '120px',
                                                    }}
                                                />
                                                <textarea
                                                    placeholder="Enter message for admin"
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    style={{
                                                        padding: '5px',
                                                        marginTop: '5px',
                                                        width: '200px',
                                                        height: '50px',
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleCounterOffer(bill.BillID)}
                                                    style={{
                                                        backgroundColor: '#FFC107', // Yellow
                                                        color: 'black',
                                                        border: 'none',
                                                        padding: '10px 15px',
                                                        fontSize: '14px',
                                                        cursor: 'pointer',
                                                        borderRadius: '5px',
                                                        marginTop: '10px',
                                                    }}
                                                >
                                                    Submit Counter Offer
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button className="complete-button disabled" disabled>
                                            {bill.Status === 'paid' ? 'Paid' : 'No Actions Available'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {showPaymentModal && selectedBill && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Pay Bill #{selectedBill.BillID}</h3>
                        <p>Amount Due: {selectedBill.AmountDue !== null ? `$${Number(selectedBill.AmountDue).toFixed(2)}` : 'N/A'}</p>
                        <label>
                            Credit Card Info:
                            <input
                                type="text"
                                value={creditCardInfo}
                                onChange={(e) => setCreditCardInfo(e.target.value)}
                                style={{ width: '100%', marginTop: '5px', padding: '5px' }}
                            />
                        </label>
                        <div style={{ marginTop: '10px' }}>
                            <button
                                onClick={handlePayBill}
                                className="complete-button"
                            >
                                Pay
                            </button>
                            <button
                                onClick={closePaymentModal}
                                className="complete-button"
                                style={{ backgroundColor: 'red', marginLeft: '10px' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewBills;
