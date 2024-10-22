const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid'); // Import UUID for unique ID generation
let books = require("../models/datadb").books;
let users = require("../models/datadb").users;

const regstd_users = express.Router();

//---- Validate if username and password provided match in users data
const authenticatedUser = async ( username, password ) => {
  const user = users.find((user) => user.username === username); // Returns a specific user based on username provided

  if ( user ) {
    return await bcrypt.compare( password, user.password ); // Compare password hashes and return a boolean
  }
 
  // User not found
  return false;
}
// --------------------------------------------------------------------------
 
// Login endpoint - Authenticate user to manage reviews (/subscriber/login)
regstd_users.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Check if username or password is missing
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  // Authenticate user using async function
  if ( await authenticatedUser( username, password ) ) {
    // Generate JWT access token for user
    const accessToken = jwt.sign({ data: username }, "access", { expiresIn: "1h" });

    // Store access token and username in session
    req.session.authorization = { accessToken, username };
    
    console.log(`User ${username} logged in successfully.`); // Debugging statement

    return res.status(200).json({ message: `Welcome ${username}, you are logged in.` });
  } else {
    return res.status(401).json({ message: "Invalid login details. Check your username and password." });
  }
});
// -----------------------------------------------------------------------------------------------------


//---- POST request: Add new book
regstd_users.post("/auth/add-book", (req, res) => {
  const { isbn, author, title } = req.body;

  // Validate input
  if (!isbn || !author || !title) {
    console.log("Invalid input:", { isbn, author, title });
    return res.status(400).json({ message: "Please ensure that all the book details are entered." });
  }

  // Check if the book already exists
  const existingBook = Object.values(books).find(book => book.isbn === isbn);
  if (existingBook) {
    return res.status(409).json({ message: `Book with ISBN: ${isbn} already exists!` });
  }

  // Create new book object
  const newBook = { isbn, author, title };

  // Generate a new key for the book
  const key = Object.keys(books).length > 0 ? Math.max(...Object.keys(books).map(Number)) + 1 : 1; // Start from 1 if no books exist

  // Add the new book to the collection using the generated key
  books[key] = newBook;

  // Send success response
  return res.status(201).json({ message: "Book added successfully!", book: newBook });
});
// -------------------------------------------------------------------------------------

//---- PUT request: Add book review based on isbn
regstd_users.put("/auth/add-review-isbn/:isbn", (req, res) => {
 
  // Retrieve the isbn from the request parameters
  const isbn = req.params.isbn.trim(); // Trim any whitespace from the ISBN

  // Check if the book exists in the collection using the isbn as a key
  const book = Object.values( books ).find(book => book.isbn === isbn);

  // Error handling: If the book does not exist, return a 404 status
  if (!book) {
    return res.status(404).json({ message: `Book with ISBN: ${isbn} not found!` });
  }

   // Validate that review data exists in the request body
   if (!req.body.review) {
    return res.status(400).json({ message: "Review information is required." });
  }


  // Provide a unique ID for the review using UUID
  const reviewId = uuidv4(); // Generate a unique ID

  // Create the new review object for the review attribute
  const newReview = {
    id: reviewId,
    content: req.body.review,
  };

  // Ensure the reviews array is initialized if it doesn't exist
  if (!Array.isArray( book.reviews )) {
    book.reviews = [];
  }

  // Add the new review to the reviews array
  book.reviews.push( newReview ); // Push new review into the reviews array

  // Return a success response with the updated book information
  return res.status(200).json({ book });
});
// ------------------------------------------------------------------------


//---- Delete request: Delete book based on ISBN
regstd_users.delete("/auth/delete-book-isbn/:isbn", (req, res) => {
 
  const isbn = req.params.isbn.trim();

  // Find book in the collection using the ISBN as a key
  const bookKey = Object.keys( books ).find(key => books[key].isbn === isbn);

  if ( !bookKey ) {
    return res.status(404).json({ message: `Book with ISBN: ${isbn} not found!` });
  }

  // Store the book to return in the response
  const deletedBook = books[bookKey];

  // Delete the book from the collection
  delete books[bookKey];

  // Return response confirming that the book has been deleted
  return res.status(200).json({ message: "Book deleted successfully.", deletedBook });
});
// ------------------------------------------------------------------------------------


//---- Delete request: Remove all reviews based on isbn
regstd_users.delete("/auth/delete-review-isbn/:isbn", (req, res) => {

  const isbn = req.params.isbn.trim(); // Trim any whitespace from the ISBN

  // Check if the book exists in the collection using the isbn as a key
  const book = Object.values(books).find(book => book.isbn === isbn);

  // Error handling: If the book does not exist, return a 404 status
  if ( !book ) {
    return res.status(404).json({ message: `Book with ISBN: ${isbn} not found!` });
  }

  // Check if there are reviews to delete
  if ( !Array.isArray(book.reviews) || book.reviews.length === 0 ) {
    return res.status(400).json({ message: "No reviews to delete." });
  }

  book.reviews = []; // Remove all reviews by setting it to an empty array

  // Return response confirming that all reviews have been deleted
  return res.status(200).json({ message: "All reviews deleted successfully.", deletedReviwed: book });
});
// ---------------------------------------------------------------------------------------------------


//---- Delete request: Remove specific book review based on isbn and reviewId
regstd_users.delete("/auth/delete-review-isbn-reviewID/:isbn/:reviewId", (req, res) => {
  // Retrieve the isbn and reviewId from the request parameters
  const isbn = req.params.isbn.trim();
  const reviewId = req.params.reviewId.trim();

  // Validate that the isbn exists in the request parameters
  if ( !isbn ) {
    return res.status(400).json({ message: "ISBN is required." });
  }

  // Validate that the reviewId exists in the request parameters
  if ( !reviewId ) {
    return res.status(400).json({ message: "Review ID is required." });
  }

   // Check if the book exists in the collection using the isbn as a key
   const book = Object.values(books).find(book => book.isbn === isbn);


  if (!book) {
    return res.status(404).json({ message: `Book with ISBN: ${isbn} not found!` });
  }

  // Check if there are reviews to delete
  if ( !book.reviews || book.reviews.length === 0 ) {
    return res.status(400).json({ message: "No reviews to delete." });
  }

  // Find the index of the review to delete
  const reviewIndex = book.reviews.findIndex(review => review.id === reviewId); // Since the review has a unique 'id'

  // Error handling: If the review does not exist, return a 404 status
  if (reviewIndex === -1) {
    return res.status(404).json({ message: `Review with ID: ${reviewId} not found!` });
  }

  // Delete the review from the array
  book.reviews.splice( reviewIndex, 1 ); // Remove the review at the found index

  // Send a response confirming the deletion
  res.status(200).json({ message: `Review with Review ID: ${reviewId} deleted successfully.` }); // Return success message to the Client
});

// Export the router and utility functions
module.exports.authenticated = regstd_users;
module.exports.users = users;
