import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const RequestAQuote = () => {
    const [address, setAddress] = useState('');
    const [squareFeet, setSquareFeet] = useState('');
    const [proposedPrice, setProposedPrice] = useState('');
    const [pictures, setPictures] = useState([]);
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Loading state
    const navigate = useNavigate();

    // Handle picture upload
    const handlePictureUpload = (event) => {
        setPictures([...event.target.files]);
    };

    // Handle form submission
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true); // Indicate loading state
    
        // Check for empty fields
        if (!address || !squareFeet || !proposedPrice || pictures.length === 0) {
            setError('All fields are required, including at least one picture.');
            setLoading(false);
            return;
        }
    
        // Prepare form data
        const formData = new FormData();
        formData.append('address', address);
        formData.append('squareFeet', squareFeet);
        formData.append('proposedPrice', proposedPrice);
        pictures.forEach((picture) => formData.append('pictures', picture));
        formData.append('note', note);
    
        try {
            // Send POST request to backend
            const res = await axios.post('http://localhost:5001/request-quote', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`, // Include JWT token for authentication
                },
            });
    
            if (res.status === 201) {
                alert('Your quote has been submitted successfully!');
                // Clear the form fields
                setAddress('');
                setSquareFeet('');
                setProposedPrice('');
                setPictures([]);
                setNote('');
            } else {
                throw new Error('Failed to submit quote');
            }
        } catch (err) {
            if (err.response?.data?.message) {
                setError(`Error: ${err.response.data.message}`);
            } else {
                setError('Failed to request quote. Please try again.');
            }
            console.error('Error:', err);
        } finally {
            setLoading(false); // Reset loading state
        }
    };
    


    return (
        <div className="request-quote-container">
            <h2>Request a Quote</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                    <label>Address:</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Square Feet of Driveway:</label>
                    <input
                        type="number"
                        value={squareFeet}
                        onChange={(e) => setSquareFeet(e.target.value)}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Proposed Price for Work:</label>
                    <input
                        type="number"
                        step="0.01"
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Upload Pictures:</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePictureUpload}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Note/Additional Information:</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="form-textarea"
                    />
                </div>
                <button type="submit" disabled={loading} className="form-button">
                    {loading ? 'Submitting...' : 'Submit Quote Request'}
                </button>
            </form>
        </div>
    );
};

export default RequestAQuote;
