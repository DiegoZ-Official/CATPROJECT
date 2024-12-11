import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './UserQuotes.css';

const UserQuotes = () => {
    const [quotes, setQuotes] = useState([]);
    const [error, setError] = useState('');
    const [counterOffer, setCounterOffer] = useState('');
    const [message, setMessage] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5001/user-quotes', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQuotes(res.data);
            } catch (err) {
                setError('Failed to fetch quotes. Please try again.');
            }
        };

        fetchQuotes();
    }, []);

    const formatToMMDDYYYY = (date) => {
        const [year, month, day] = date.split('-');
        return `${month}/${day}/${year}`;
    };

    const handleAcceptOffer = async (quoteID) => {
        if (!selectedDate) {
            alert('Please select a date to proceed.');
            return;
        }

        const formattedDate = formatToMMDDYYYY(selectedDate);

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5001/accept-offer',
                { QuoteID: quoteID, Date: formattedDate },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Offer accepted successfully!');
            setQuotes((prevQuotes) =>
                prevQuotes.map((quote) =>
                    quote.QuoteID === quoteID
                        ? { ...quote, Status: 'approved', SelectedDate: formattedDate }
                        : quote
                )
            );
        } catch (err) {
            alert('Failed to accept the offer. Please try again.');
        }
    };

    const handleCounterOffer = async (quoteID) => {
        if (!counterOffer) {
            alert('Please enter a counter offer.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5001/set-counter-offer',
                {
                    QuoteID: quoteID,
                    CounterOffer: counterOffer,
                    Message: message || null,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            alert('Counter offer submitted successfully!');
            setCounterOffer('');
            setMessage('');
            setQuotes((prevQuotes) =>
                prevQuotes.map((quote) =>
                    quote.QuoteID === quoteID
                        ? { ...quote, Status: 'pending', ProposedPrice: counterOffer }
                        : quote
                )
            );
        } catch (err) {
            alert('Failed to submit counter offer. Please try again.');
        }
    };

    const handleDateSelection = (date, allowedDates) => {
        const formattedDate = new Date(date).toISOString().split('T')[0];
        if (allowedDates.includes(formattedDate)) {
            setSelectedDate(formattedDate);
        } else {
            alert('Please select a valid date.');
        }
    };

    const renderCalendar = (quote) => {
        if (quote.Status !== 'waiting for client' || !quote.TimeWindow) {
            return null;
        }

        let allowedDates = [];
        try {
            // Convert dates to 'YYYY-MM-DD' format
            allowedDates = quote.TimeWindow.map((date) => {
                const [month, day, year] = date.split('/');
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            });

            if (!Array.isArray(allowedDates)) {
                console.error('Invalid TimeWindow format. Expected an array.');
                allowedDates = [];
            }
        } catch (err) {
            console.error('Failed to process TimeWindow:', err);
            allowedDates = [];
        }

        return (
            <div className="calendar-container">
                <label>Select a Date:</label>
                <Calendar
                    tileDisabled={({ date }) =>
                        !allowedDates.includes(date.toISOString().split('T')[0])
                    }
                    tileClassName={({ date }) =>
                        allowedDates.includes(date.toISOString().split('T')[0])
                            ? 'allowed-date'
                            : null
                    }
                    onClickDay={(date) => handleDateSelection(date, allowedDates)}
                />
                {selectedDate && (
                    <p className="selected-date">
                        Selected Date: {new Date(selectedDate).toLocaleDateString()}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="user-quotes-container">
            <h2>Your Quotes</h2>
            {error && <p className="error-message">{error}</p>}
            {quotes.length === 0 ? (
                <p className="no-quotes">No quotes found.</p>
            ) : (
                quotes.map((quote) => (
                    <div key={quote.QuoteID} className="quote-card">
                        <h3 className="quote-title">Quote #{quote.QuoteID}</h3>
                        <div className="quote-info">
                            <p><strong>Address:</strong> {quote.PropertyAddress}</p>
                            <p><strong>Square Feet:</strong> {quote.DrivewaySqFt || 'N/A'}</p>
                            <p><strong>Proposed Price:</strong> {quote.ProposedPrice ? `$${quote.ProposedPrice}` : 'N/A'}</p>
                            <p><strong>Status:</strong> {quote.Status}</p>
                            {quote.Message && (
                                <p><strong>Admin Message:</strong> {quote.Message}</p>
                            )}
                        </div>
                        {quote.Status === 'waiting for client' && (
                            <>
                                {renderCalendar(quote)}
                                <div className="action-buttons">
                                    <button
                                        className="accept-offer-button"
                                        onClick={() => handleAcceptOffer(quote.QuoteID)}
                                    >
                                        Accept Offer
                                    </button>
                                    <div className="counter-offer-container">
                                        <input
                                            type="text"
                                            placeholder="Enter counter offer"
                                            value={counterOffer}
                                            onChange={(e) => setCounterOffer(e.target.value)}
                                            className="counter-offer-input"
                                        />
                                        <textarea
                                            placeholder="Enter message for admin"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="counter-offer-message"
                                        />
                                        <button
                                            className="counter-offer-button"
                                            onClick={() => handleCounterOffer(quote.QuoteID)}
                                        >
                                            Submit Counter Offer
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default UserQuotes;
