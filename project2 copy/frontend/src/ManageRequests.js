import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './ManageRequests.css';

const ManageRequests = () => {
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [offer, setOffer] = useState('');
    const [selectedDates, setSelectedDates] = useState([]);
    const [rejectionReason, setRejectionReason] = useState('');
    const [message, setMessage] = useState(""); // Add a state for the message

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5001/manage-requests', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRequests(res.data);
            } catch (err) {
                setError('Failed to fetch requests. Please try again.');
            }
        };

        fetchRequests();
    }, []);

    const formatDate = (date) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(date).toLocaleDateString('en-US', options); // MM/DD/YYYY format
    };

    const handleDateClick = (date) => {
        const formattedDate = formatDate(date);
        if (selectedDates.includes(formattedDate)) {
            setSelectedDates(selectedDates.filter((d) => d !== formattedDate));
        } else {
            setSelectedDates([...selectedDates, formattedDate]);
        }
    };

    const handleCloseMenu = () => {
        setSelectedRequest(null);
        setOffer('');
        setSelectedDates([]);
        setRejectionReason('');
    };
    

    const handleUpdateRequest = async (status, additionalData = {}) => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                QuoteID: selectedRequest.QuoteID,
                Status: status,
                Offer: additionalData.Offer || selectedRequest.ProposedPrice, // Use the current ProposedPrice if no new Offer
                TimeWindow: selectedDates.length > 0 ? selectedDates : selectedRequest.TimeWindow, // Keep existing TimeWindow if not updated
                Message: additionalData.Message || null,
            };
    
            console.log('Payload:', payload); // Debugging log
    
            await axios.post('http://localhost:5001/update-request', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            setSuccess(`Request updated to ${status} successfully!`);
    
            setRequests((prevRequests) =>
                prevRequests.map((req) =>
                    req.QuoteID === selectedRequest.QuoteID
                        ? {
                              ...req,
                              Status: status,
                              ProposedPrice: payload.Offer, // Update the ProposedPrice in UI
                              TimeWindow: payload.TimeWindow, // Update TimeWindow in UI
                          }
                        : req
                )
            );
    
            setSelectedRequest(null);
            setOffer('');
            setSelectedDates([]);
            setRejectionReason('');
        } catch (err) {
            if (err.response?.data?.message) {
                setError(`Error: ${err.response.data.message}`);
            } else {
                setError('Failed to update request. Please try again.');
            }
            console.error(err);
        }
    };
    

    const handleRequestUpdate = async () => {
        if (!offer || selectedDates.length === 0) {
            alert("Please provide both an updated price and at least one date.");
            return;
        }
    
        try {
            const token = localStorage.getItem("token");
            const payload = {
                QuoteID: selectedRequest.QuoteID,
                Status: "waiting for client",
                Offer: offer,
                TimeWindow: selectedDates,
                Message: message, // Include the message
            };
    
            await axios.post("http://localhost:5001/update-request", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            alert("Update requested successfully!");
            setRequests((prevRequests) =>
                prevRequests.map((req) =>
                    req.QuoteID === selectedRequest.QuoteID
                        ? {
                              ...req,
                              Status: "waiting for client",
                              ProposedPrice: offer,
                              TimeWindow: selectedDates,
                              Message: message,
                          }
                        : req
                )
            );
            setSelectedRequest(null);
            setOffer("");
            setSelectedDates([]);
            setMessage(""); // Clear the message after submission
            setRejectionReason("");
        } catch (err) {
            alert("Failed to request update. Please try again.");
            console.error(err);
        }
    };
    

    return (
        <div className="manage-requests-container">
            <h2 className="title">Manage Requests</h2>
            {success && <p className="success-message">{success}</p>}
            {error && <p className="error-message">{error}</p>}
            {requests.length === 0 ? (
                <p className="no-requests">No incoming requests to manage.</p>
            ) : (
                <ul className="requests-list">
                    {requests.map((request) => (
                        <li
                            key={request.QuoteID}
                            className={`request-item ${selectedRequest?.QuoteID === request.QuoteID ? 'active' : ''}`}
                            onClick={() => setSelectedRequest(request)}
                        >
                            <p><strong>Quote #{request.QuoteID}</strong></p>
                            <p>Address: {request.PropertyAddress}</p>
                            <p>Proposed Price: ${request.ProposedPrice}</p>
                            <p>Status: {request.Status}</p>
                            <p>Customer: {request.FirstName} {request.LastName} ({request.Email})</p>
                        </li>
                    ))}
                </ul>
            )}
            {selectedRequest && (
                <div className="request-details">
                    <button className="close-button" onClick={handleCloseMenu}>X</button>
                    <h3>Manage Quote #{selectedRequest.QuoteID}</h3>
                    <div className="form-group">
                        <label>Offer:</label>
                        <input
                            type="text"
                            value={offer}
                            onChange={(e) => setOffer(e.target.value)}
                            placeholder="Enter offer price"
                        />
                    </div>
                    <div className="form-group">
                        <label>Set Available Dates:</label>
                        <Calendar
                            onClickDay={handleDateClick}
                            tileClassName={({ date }) =>
                                selectedDates.includes(formatDate(date)) ? 'selected-date' : null
                            }
                        />
                        <div className="selected-dates">
                            <p><strong>Selected Dates:</strong> {selectedDates.join(', ') || 'None'}</p>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Message:</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter a message for the client"
                            className="message-box"
                        />
                    </div>
                    <div className="button-group">
                        <button
                            className="button agree-button"
                            onClick={() => handleUpdateRequest('waiting for client', { Offer: offer, TimeWindow: selectedDates })}
                        >
                            Agree to Order
                        </button>
                        <button
                            className="update-button"
                            onClick={handleRequestUpdate}
                        >
                            Request Update
                        </button>
                        <button
                            className="button deny-button"
                            onClick={() => handleUpdateRequest('denied', { Message: rejectionReason })}
                        >
                            Deny Request
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageRequests;
