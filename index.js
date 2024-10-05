/* This code implements an Express.js application with user authentication and review management functionality (CRUD). */

// Import necessary modules
const express = require('express'); 
const jwt = require('jsonwebtoken'); 
const session = require('express-session');
const subscriber_routes = require('./router/users_auth.js').authenticated; // Import authenticated subscriber routes
const guest_routes = require('./router/guest.js').guest; // Import guest routes

// Create an instance of an Express application
const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Set up session management for subscriber routes
app.use("/subscriber", session({
    secret: "fingerprint_subscriber", // Secret key for signing the session ID cookie
    resave: true, // Forces the session to be saved back to the session store even if it was never modified during the request
    saveUninitialized: true // Forces a session that is new but not modified to be saved to the store
}));

// Authentication middleware for routes under "/subscriber/auth/*"
app.use("/subscriber/auth/*", function auth(req, res, next) {
    const token = req.session.authorization?.accessToken;

    // Verify JWT token or check session validity
    if ( !token ) {
        return res.status(403).json({ message: "User not logged in." });
    }

    // Verify JWT
    jwt.verify(token, "access", (err, user) => {
        if ( err ) {
            return res.status(403).json({ message: "User not authenticated"});
        }

        req.user = user; // Send user info to request
        next(); // Call next() to proceed to the next middleware or route handler if authenticated

    });
});


// Define the server port, using environment variable or default to 8000
const PORT = process.env.PORT || 8000;

// Use subscriber routes under "/subscriber" path
app.use("/subscriber", subscriber_routes);

// Use guest routes under "/" path
app.use("/", guest_routes);

// Start the server and listen on the specified port
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));