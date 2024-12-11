import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import './ManageBills.css';

const ManageBills = () => {
    const [bills, setBills] = useState([]);
    const [error, setError] = useState('');
    const [counterOffer, setCounterOffer] = useState('');
    const [message, setMessage] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filteredBills, setFilteredBills] = useState([]);

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5001/manage-bills', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setBills(res.data);
                setFilteredBills(res.data);
            } catch (err) {
                console.error('Error fetching bills:', err);
                setError('Failed to fetch bills. Please try again.');
            }
        };

        fetchBills();
    }, []);

    const handleFilterBills = () => {
        if (!startDate || !endDate) {
            alert("Please select a valid start and end date.");
            return;
        }

        const filtered = bills.filter(bill => {
            const billDate = new Date(bill.BillDate);
            return billDate >= new Date(startDate) && billDate <= new Date(endDate);
        });

        setFilteredBills(filtered);
    };

    const generatePDF = () => {
        const pdf = new jsPDF();
        pdf.text("Bills Report", 14, 10);

        const tableData = filteredBills.map((bill) => [
            bill.BillID,
            bill.OrderID,
            bill.BillDate || "N/A",
            `$${Number(bill.AmountDue).toFixed(2)}`,
            bill.PayDate || "N/A",
            bill.Status,
        ]);

        const totalEarned = filteredBills.reduce((sum, bill) => sum + parseFloat(bill.AmountDue || 0), 0);

        pdf.autoTable({
            head: [["Bill ID", "Order ID", "Bill Date", "Amount Due", "Pay Date", "Status"]],
            body: tableData,
            startY: 20,
        });

        pdf.text(`Total Earned: $${totalEarned.toFixed(2)}`, 14, pdf.lastAutoTable.finalY + 10);

        pdf.save("BillsReport.pdf");
    };

    const handleSubmitCounterOffer = async (billID) => {
        if (!counterOffer || counterOffer <= 0) {
            alert("Please provide a valid counter offer.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5001/admin/counter-bill",
                { BillID: billID, AmountDue: counterOffer, Message: message },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(response.data.message);
            setCounterOffer("");
            setMessage("");
            setBills((prevBills) =>
                prevBills.map((bill) =>
                    bill.BillID === billID
                        ? { ...bill, Status: "waiting for client", AmountDue: counterOffer }
                        : bill
                )
            );
        } catch (err) {
            console.error("Failed to submit counter offer:", err.response?.data || err);
            alert("Failed to submit counter offer. Please try again.");
        }
    };

    const handleAcceptCounterOffer = async (billID) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5001/accept-counter-offer",
                { BillID: billID },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(response.data.message);

            setBills((prevBills) =>
                prevBills.map((bill) =>
                    bill.BillID === billID
                        ? { ...bill, Status: "waiting for client" }
                        : bill
                )
            );
        } catch (err) {
            console.error("Failed to accept the counter offer:", err.response?.data || err);
            alert("Failed to accept the counter offer. Please try again.");
        }
    };

    return (
        <div className="manage-bills-container">
            <h2>Manage Bills</h2>
            {error && <p className="error-message">{error}</p>}

            <div>
                <label>
                    Start Date:
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </label>
                <label>
                    End Date:
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </label>
                <button onClick={handleFilterBills}>Filter Bills</button>
            </div>

            {filteredBills.length === 0 ? (
                <p>No bills to manage.</p>
            ) : (
                <>
                    <table className="bills-table">
                        <thead>
                            <tr>
                                <th>Bill ID</th>
                                <th>Order ID</th>
                                <th>Bill Date</th>
                                <th>Amount Due</th>
                                <th>Pay Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBills.map((bill) => (
                                <tr key={bill.BillID}>
                                    <td>{bill.BillID}</td>
                                    <td>{bill.OrderID}</td>
                                    <td>{bill.BillDate ? new Date(bill.BillDate).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                        {bill.AmountDue ? `$${Number(bill.AmountDue).toFixed(2)}` : 'N/A'}
                                    </td>
                                    <td>{bill.PayDate ? new Date(bill.PayDate).toLocaleDateString() : 'N/A'}</td>
                                    <td>{bill.Status}</td>
                                    <td>
                                        {bill.Status === 'disputed' && (
                                            <>
                                                <button
                                                    onClick={() => handleAcceptCounterOffer(bill.BillID)}
                                                    className="complete-button"
                                                >
                                                    Accept Counter Offer
                                                </button>
                                                <input
                                                    type="number"
                                                    placeholder="Counter Offer"
                                                    value={counterOffer}
                                                    onChange={(e) => setCounterOffer(e.target.value)}
                                                />
                                                <textarea
                                                    placeholder="Message"
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleSubmitCounterOffer(bill.BillID)}
                                                >
                                                    Submit Counter Offer
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={generatePDF}>Generate PDF</button>
                </>
            )}
        </div>
    );
};

export default ManageBills;
