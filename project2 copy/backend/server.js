// Required dependencies
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./db'); 

const app = express();

// Middleware to parse JSON data and handle CORS (Cross-Origin Resource Sharing)
app.use(bodyParser.json());
app.use(cors());

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Export the pool for use in other modules
module.exports = db;


// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/'); // Ensure the `uploads` directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Unique file name
  },
});

const upload = multer({ storage: storage });



// Connect to the MySQL database
db.query('SELECT 1', (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to MySQL database.');
  }
});

// Start the server and listen on port 5001
app.listen(5001, () => {
  console.log('Server is running on port 5001');
});

// User registration route
app.post('/register', async (req, res) => {
  const { FirstName, LastName, Address, CreditCardInfo, PhoneNumber, Email, password } = req.body;

  if (!Email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `INSERT INTO Clients (FirstName, LastName, Address, CreditCardInfo, PhoneNumber, Email, password, Role) VALUES (?, ?, ?, ?, ?, ?, ?, 'user')`;
    const values = [FirstName, LastName, Address, CreditCardInfo || null, PhoneNumber, Email, hashedPassword];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ message: 'Registration failed', error: err.message });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
});

// User login route
app.post('/login', (req, res) => {
  const { Email, password } = req.body;

  if (!Email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const query = 'SELECT * FROM Clients WHERE Email = ?';
  db.query(query, [Email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { ClientID: user.ClientID, Email: user.Email, Role: user.Role },
      'your_jwt_secret',
      { expiresIn: '3h' }
    );

    res.json({ token });
  });
});

// Middleware function to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });

    const query = 'SELECT Role FROM Clients WHERE ClientID = ?';
    db.query(query, [user.ClientID], (dbErr, results) => {
      if (dbErr || results.length === 0) {
        return res.status(500).json({ message: 'Failed to verify user role.' });
      }

      req.user = { ...user, Role: results[0].Role };
      next();
    });
  });
};

// Admin authorization middleware
const authorizeAdmin = (req, res, next) => {
  if (req.user.Role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access only.' });
  }
  next();
};

// REQUEST QUOTE
app.post('/request-quote', authenticateToken, upload.array('pictures', 5), (req, res) => {
  const { address, squareFeet, proposedPrice, note } = req.body;
  const clientID = req.user.ClientID;
  const pictures = req.files || [];

  // Validate required fields
  if (!address || !squareFeet || !proposedPrice || pictures.length === 0) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Prepare query to insert quote into `Quotes` table
  const quoteQuery = `
      INSERT INTO Quotes (ClientID, PropertyAddress, DrivewaySqFt, ProposedPrice, Message, Status) 
      VALUES (?, ?, ?, ?, ?, 'pending')
  `;
  const quoteValues = [clientID, address, squareFeet, proposedPrice, note];

  // Insert quote and retrieve `QuoteID`
  db.query(quoteQuery, quoteValues, (err, result) => {
    if (err) {
      console.error('Database error when inserting quote:', err.message);
      return res.status(500).json({ message: 'Failed to submit quote request.', error: err.message });
    }

    const quoteID = result.insertId; // Get the generated `QuoteID`

    // Prepare queries for inserting images into `QuoteImages` table
    const imageQueries = pictures.map((file) => {
      const imageUrl = `localhost/test/QuoteImages/${file.filename}`; // Construct the URL
      return new Promise((resolve, reject) => {
        const imageQuery = `
            INSERT INTO QuoteImages (QuoteID, ImageURL)
            VALUES (?, ?)
        `;
        const imageValues = [quoteID, imageUrl];
        db.query(imageQuery, imageValues, (imgErr, imgResult) => {
          if (imgErr) {
            console.error('Database error when inserting image:', imgErr.message);
            return reject(imgErr);
          }
          resolve(imgResult);
        });
      });
    });

    // Execute all image insertion queries
    Promise.all(imageQueries)
      .then(() => {
        res.status(201).json({ message: 'Quote request submitted successfully!' });
      })
      .catch((imageErr) => {
        console.error('Error inserting images:', imageErr.message);
        res.status(500).json({ message: 'Failed to upload images.', error: imageErr.message });
      });
  });
});




app.get('/profile', authenticateToken, (req, res) => {
  const query = 'SELECT Email, Role FROM Clients WHERE ClientID = ?';
  db.query(query, [req.user.ClientID], (err, results) => {
      if (err || results.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json(results[0]); // Return email and role
  });
});


// VIEW YOUR QUOTES
app.get('/user-quotes', authenticateToken, (req, res) => {
  const clientID = req.user.ClientID;

  const query = `
      SELECT QuoteID, PropertyAddress, DrivewaySqFt, ProposedPrice, Status, 
             JSON_UNQUOTE(TimeWindow) AS TimeWindow, Offer, Message
      FROM Quotes
      WHERE ClientID = ?
  `;

  db.query(query, [clientID], (err, results) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to fetch user quotes.', error: err.message });
    }

    results.forEach((quote) => {
      if (quote.TimeWindow) {
          try {
              quote.TimeWindow = JSON.parse(quote.TimeWindow);
          } catch (err) {
              console.error('Invalid TimeWindow:', quote.TimeWindow);
              quote.TimeWindow = null; 
          }
      }
  });
  

    res.status(200).json(results);
  });
});

// Manage requests route
app.get('/manage-requests', authenticateToken, authorizeAdmin, (req, res) => {
  const query = `
    SELECT q.QuoteID, q.PropertyAddress, q.ProposedPrice, q.Status, 
           JSON_UNQUOTE(q.TimeWindow) AS TimeWindow, q.Offer, q.Message, 
           c.FirstName, c.LastName, c.Email
    FROM Quotes q
    JOIN Clients c ON q.ClientID = c.ClientID
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to fetch requests.', error: err.message });
    }

    results.forEach((quote) => {
      if (quote.TimeWindow) {
        quote.TimeWindow = JSON.parse(quote.TimeWindow);
      }
    });

    res.json(results);
  });
});

// Update request route
app.post('/update-request', authenticateToken, (req, res) => {
  const { QuoteID, Status, Offer, TimeWindow, Message } = req.body;

  if (!QuoteID || !Status) {
    return res.status(400).json({ message: 'QuoteID and Status are required.' });
  }

  const queryUpdateQuote = `
      UPDATE Quotes 
      SET Status = ?, ProposedPrice = ?, TimeWindow = ?, Message = ?
      WHERE QuoteID = ?
  `;

  const queryCreateOrder = `
      INSERT INTO Orders (QuoteID, WorkStartDate, AgreedPrice, Status) 
      VALUES (?, ?, ?, 'pending')
  `;

  // Use the connection pool
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Database connection error:', err.message);
      return res.status(500).json({ message: 'Failed to get database connection.' });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: 'Transaction failed to start.' });
      }

      // Step 1: Update the quote
      connection.query(
        queryUpdateQuote,
        [Status, Offer, JSON.stringify(TimeWindow), Message, QuoteID],
        (err, result) => {
          if (err) {
            connection.rollback(() => connection.release());
            console.error('Failed to update quote:', err.message);
            return res.status(500).json({ message: 'Failed to update the quote.' });
          }

          if (result.affectedRows === 0) {
            connection.rollback(() => connection.release());
            return res.status(404).json({ message: 'Quote not found.' });
          }

          // If the status is not 'agreed', commit and exit
          if (Status !== 'agreed') {
            connection.commit((err) => {
              connection.release();
              if (err) {
                console.error('Failed to commit transaction:', err.message);
                return res.status(500).json({ message: 'Transaction commit failed.' });
              }
              return res.status(200).json({ message: 'Quote updated successfully.' });
            });
            return;
          }

          // Step 2: Create the order
          const workStartDate = TimeWindow && TimeWindow.length > 0 ? TimeWindow[0] : null; // First available date
          connection.query(
            queryCreateOrder,
            [QuoteID, workStartDate, Offer],
            (err) => {
              if (err) {
                connection.rollback(() => connection.release());
                console.error('Failed to create order:', err.message);
                return res.status(500).json({ message: 'Failed to create the order.' });
              }

              connection.commit((err) => {
                connection.release();
                if (err) {
                  console.error('Failed to commit transaction:', err.message);
                  return res.status(500).json({ message: 'Transaction commit failed.' });
                }

                res.status(200).json({ message: 'Quote updated and order created successfully.' });
              });
            }
          );
        }
      );
    });
  });
});





// Set Counter Offer Route
app.post('/set-counter-offer', authenticateToken, (req, res) => {
  const { QuoteID, CounterOffer, Message } = req.body;

  if (!QuoteID || !CounterOffer) {
    return res.status(400).json({ message: 'QuoteID and CounterOffer are required.' });
  }

  const query = `
      UPDATE Quotes
      SET Status = 'pending', ProposedPrice = ?, Message = ?
      WHERE QuoteID = ? AND ClientID = ?
  `;

  db.query(query, [CounterOffer, Message || null, QuoteID, req.user.ClientID], (err, result) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to submit counter offer.', error: err.message });
    }

    res.status(200).json({ message: 'Counter offer submitted successfully!' });
  });
});

// Accept Offer Route
app.post('/accept-offer', authenticateToken, (req, res) => {
  const { QuoteID, Date } = req.body;

  if (!QuoteID || !Date) {
      return res.status(400).json({ message: 'QuoteID and Date are required.' });
  }

  // Normalize MM/DD/YYYY to YYYY-MM-DD
  let workStartDate = Date;
  if (Date.includes('/')) {
      const [month, day, year] = Date.split('/');
      workStartDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const queryFetchTimeWindow = `
      SELECT TimeWindow, ProposedPrice
      FROM Quotes
      WHERE QuoteID = ?
  `;
  const queryUpdateQuote = `
      UPDATE Quotes
      SET Status = 'agreed'
      WHERE QuoteID = ?
  `;
  const queryCreateOrder = `
      INSERT INTO Orders (QuoteID, WorkStartDate, AgreedPrice, Status)
      VALUES (?, ?, ?, 'pending')
  `;

  db.getConnection((err, connection) => {
      if (err) {
          console.error('Database connection error:', err.message);
          return res.status(500).json({ message: 'Failed to get database connection.' });
      }

      connection.beginTransaction((err) => {
          if (err) {
              connection.release();
              return res.status(500).json({ message: 'Transaction failed to start.' });
          }

          connection.query(queryFetchTimeWindow, [QuoteID], (err, results) => {
              if (err) {
                  connection.rollback(() => connection.release());
                  console.error('Failed to fetch quote details:', err.message);
                  return res.status(500).json({ message: 'Failed to fetch quote details.' });
              }

              if (results.length === 0) {
                  connection.rollback(() => connection.release());
                  return res.status(404).json({ message: 'Quote not found.' });
              }

              const agreedPrice = results[0].ProposedPrice;

              connection.query(queryUpdateQuote, [QuoteID], (err) => {
                  if (err) {
                      connection.rollback(() => connection.release());
                      console.error('Failed to update quote:', err.message);
                      return res.status(500).json({ message: 'Failed to update the quote.' });
                  }

                  connection.query(queryCreateOrder, [QuoteID, workStartDate, agreedPrice], (err) => {
                      if (err) {
                          connection.rollback(() => connection.release());
                          console.error('Failed to create order:', err.message);
                          return res.status(500).json({ message: 'Failed to create the order.' });
                      }

                      connection.commit((err) => {
                          connection.release();
                          if (err) {
                              console.error('Failed to commit transaction:', err.message);
                              return res.status(500).json({ message: 'Transaction commit failed.' });
                          }

                          res.status(200).json({ message: 'Offer accepted and order created successfully.' });
                      });
                  });
              });
          });
      });
  });
});


app.get('/view-bills', authenticateToken, (req, res) => {
  const clientID = req.user.ClientID;

  const query = `
      SELECT b.*, o.QuoteID, COALESCE(b.AmountDue, 0) AS AmountDue 
      FROM Bills b
      JOIN Orders o ON b.OrderID = o.OrderID
      JOIN Quotes q ON o.QuoteID = q.QuoteID
      WHERE q.ClientID = ?
  `;

  db.query(query, [clientID], (err, results) => {
      if (err) {
          console.error('Failed to fetch bills:', err.message);
          return res.status(500).json({ message: 'Failed to fetch bills.' });
      }

      res.status(200).json(results);
  });
});







module.exports = app;

app.post('/complete-order', authenticateToken, (req, res) => {
  const { OrderID } = req.body;
  const completeDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

  const queryCompleteOrder = `
      UPDATE Orders 
      SET WorkEndDate = ?, Status = 'completed' 
      WHERE OrderID = ?
  `;
  const queryCreateBill = `
      INSERT INTO Bills (OrderID, BillDate, AmountDue, Status) 
      VALUES (?, ?, (SELECT AgreedPrice FROM Orders WHERE OrderID = ?), 'waiting for client')
  `;

  db.getConnection((err, connection) => {
      if (err) return res.status(500).json({ message: 'Database connection failed.' });

      connection.beginTransaction((err) => {
          if (err) {
              connection.release();
              return res.status(500).json({ message: 'Transaction failed to start.' });
          }

          // Step 1: Complete Order
          connection.query(queryCompleteOrder, [completeDate, OrderID], (err) => {
              if (err) {
                  connection.rollback(() => connection.release());
                  return res.status(500).json({ message: 'Failed to complete order.' });
              }

              // Step 2: Create Bill
              connection.query(queryCreateBill, [OrderID, completeDate, OrderID], (err) => {
                  if (err) {
                      connection.rollback(() => connection.release());
                      return res.status(500).json({ message: 'Failed to create bill.' });
                  }

                  connection.commit((err) => {
                      connection.release();
                      if (err) return res.status(500).json({ message: 'Transaction commit failed.' });

                      res.status(200).json({ message: 'Order completed and bill created successfully!' });
                  });
              });
          });
      });
  });
});




app.post('/create-order', authenticateToken, (req, res) => {
  const { QuoteID, WorkStartDate, AgreedPrice } = req.body;

  if (!QuoteID || !WorkStartDate || !AgreedPrice) {
    return res.status(400).json({ message: 'QuoteID, WorkStartDate, and AgreedPrice are required.' });
  }

  const query = `
      INSERT INTO Orders (QuoteID, WorkStartDate, AgreedPrice, Status) 
      VALUES (?, ?, ?, 'pending')
  `;

  db.query(query, [QuoteID, WorkStartDate, AgreedPrice], (err, result) => {
    if (err) {
      console.error('Failed to create order:', err.message);
      return res.status(500).json({ message: 'Failed to create order.', error: err.message });
    }

    res.status(201).json({ message: 'Order created successfully!', OrderID: result.insertId });
  });
});


app.get('/manage-orders', authenticateToken, (req, res) => {
  const query = `
      SELECT * FROM Orders
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Failed to fetch orders:', err.message);
          return res.status(500).json({ message: 'Failed to fetch orders.' });
      }
      res.status(200).json(results);
  });
});


// Fetch all bills
app.get('/manage-bills', authenticateToken, (req, res) => {
  const query = `SELECT * FROM Bills`;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Failed to fetch bills:', err.message);
          return res.status(500).json({ message: 'Failed to fetch bills.' });
      }
      res.status(200).json(results);
  });
});

// Update a bill's status to paid
app.post('/update-bill', authenticateToken, (req, res) => {
  const { BillID } = req.body;

  if (!BillID) {
      return res.status(400).json({ message: 'BillID is required.' });
  }

  const query = `
      UPDATE Bills
      SET Status = 'paid', PayDate = ?
      WHERE BillID = ?
  `;

  db.query(query, [new Date().toISOString().split('T')[0], BillID], (err, result) => {
      if (err) {
          console.error('Failed to update bill:', err.message);
          return res.status(500).json({ message: 'Failed to update the bill.' });
      }

      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Bill not found.' });
      }

      res.status(200).json({ message: 'Bill updated successfully.' });
  });
});

app.post('/pay-bill', authenticateToken, (req, res) => {
  const { BillID, CreditCardInfo } = req.body;

  if (!BillID) {
      return res.status(400).json({ message: 'BillID is required.' });
  }

  if (!CreditCardInfo || CreditCardInfo.trim() === '') {
      return res.status(400).json({ message: 'Valid CreditCardInfo is required.' });
  }

  const queryUpdateBill = `
      UPDATE Bills
      SET Paid = 1, Status = 'paid', PayDate = CURDATE()
      WHERE BillID = ?
  `;

  const queryUpdateClient = `
      UPDATE Clients
      SET CreditCardInfo = ?
      WHERE ClientID = ?
  `;

  const clientID = req.user.ClientID;

  db.getConnection((err, connection) => {
      if (err) {
          console.error('Database connection error:', err.message);
          return res.status(500).json({ message: 'Database connection failed.' });
      }

      connection.beginTransaction((err) => {
          if (err) {
              connection.release();
              return res.status(500).json({ message: 'Transaction failed to start.' });
          }

          // Step 1: Update the Bill
          connection.query(queryUpdateBill, [BillID], (err, result) => {
              if (err) {
                  connection.rollback(() => connection.release());
                  console.error('Failed to update bill:', err.message);
                  return res.status(500).json({ message: 'Failed to update the bill.' });
              }

              if (result.affectedRows === 0) {
                  connection.rollback(() => connection.release());
                  return res.status(404).json({ message: 'Bill not found or already paid.' });
              }

              // Step 2: Update CreditCardInfo
              connection.query(queryUpdateClient, [CreditCardInfo, clientID], (err) => {
                  if (err) {
                      connection.rollback(() => connection.release());
                      console.error('Failed to update CreditCardInfo:', err.message);
                      return res.status(500).json({ message: 'Failed to update CreditCardInfo.' });
                  }

                  connection.commit((err) => {
                      connection.release();
                      if (err) {
                          console.error('Failed to commit transaction:', err.message);
                          return res.status(500).json({ message: 'Transaction commit failed.' });
                      }

                      res.status(200).json({ message: 'Bill paid successfully!' });
                  });
              });
          });
      });
  });
});


// Endpoint to handle counter-offer for bills
app.post('/counter-bill', authenticateToken, (req, res) => {
  const { BillID, CounterOffer, Message } = req.body;

  if (!BillID || !CounterOffer || CounterOffer <= 0) {
      return res.status(400).json({ message: 'Valid BillID and CounterOffer are required.' });
  }

  const queryCheckStatus = `
      SELECT Status FROM Bills WHERE BillID = ?
  `;
  const queryUpdateBill = `
      UPDATE Bills
      SET AmountDue = ?, Message = ?, Status = 'disputed'
      WHERE BillID = ? AND Status = 'waiting for client'
  `;

  db.query(queryCheckStatus, [BillID], (err, results) => {
      if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({ message: 'Failed to check bill status.' });
      }

      if (results.length === 0 || results[0].Status !== 'waiting for client') {
          return res.status(400).json({ message: 'Bill not found or not in a valid state for counter offer.' });
      }

      db.query(queryUpdateBill, [CounterOffer, Message, BillID], (err, result) => {
          if (err) {
              console.error('Database error:', err.message);
              return res.status(500).json({ message: 'Failed to update the bill.' });
          }

          if (result.affectedRows === 0) {
              return res.status(404).json({ message: 'Bill not found or unable to update.' });
          }

          res.status(200).json({ message: 'Counter offer submitted successfully.' });
      });
  });
});



app.post('/admin/counter-bill', authenticateToken, (req, res) => {
  const { BillID, AmountDue, Message } = req.body;

  // Validate input
  if (!BillID || !AmountDue || AmountDue <= 0) {
    return res.status(400).json({ message: 'Valid BillID and AmountDue are required.' });
  }

  const queryUpdateBill = `
      UPDATE Bills
      SET AmountDue = ?, Message = ?, Status = 'waiting for client'
      WHERE BillID = ?
  `;

  db.query(queryUpdateBill, [AmountDue, Message, BillID], (err, result) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Failed to update the bill.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    res.status(200).json({ message: 'Counter offer updated successfully and status set to "waiting for client".' });
  });
});


app.post('/accept-counter-offer', authenticateToken, (req, res) => {
  const { BillID } = req.body;

  if (!BillID) {
      return res.status(400).json({ message: 'BillID is required.' });
  }

  const queryUpdateBillStatus = `
      UPDATE Bills
      SET Status = 'waiting for client'
      WHERE BillID = ? AND Status = 'disputed'
  `;

  db.query(queryUpdateBillStatus, [BillID], (err, result) => {
      if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({ message: 'Failed to update bill status.' });
      }

      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Bill not found or not in a valid state.' });
      }

      res.status(200).json({ message: 'Counter offer accepted. Status updated to "waiting for client".' });
  });
});


app.get('/get-credit-card', authenticateToken, (req, res) => {
  const clientID = req.user.ClientID;

  const query = `
      SELECT CreditCardInfo 
      FROM Clients 
      WHERE ClientID = ?
  `;

  db.query(query, [clientID], (err, results) => {
      if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({ message: 'Failed to fetch credit card information.' });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: 'Client not found.' });
      }

      res.status(200).json({ CreditCardInfo: results[0].CreditCardInfo });
  });
});

// Endpoint to fetch all customers
app.get('/admin/customers', authenticateToken, authorizeAdmin, (req, res) => {
  const query = `
      SELECT ClientID, FirstName, LastName, Address, CreditCardInfo, PhoneNumber, Email, Role
      FROM Clients
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Failed to fetch customers:', err.message);
          return res.status(500).json({ message: 'Failed to fetch customers.' });
      }
      res.status(200).json(results);
  });
});
