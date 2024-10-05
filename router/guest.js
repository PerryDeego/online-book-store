const express = require('express');
const bcrypt = require('bcrypt');
let books = require("../models/booksdb.js");
let isValid = require("./users_auth.js").isValid;
let users = require("./users_auth.js").users;
const guest_users = express.Router();

//---- POST request: Register a new user
guest_users.post("/register",async (req,res) => {
  const { username, password } = req.body;
  // Validate if credential provided is valid
  if ( !username || !password ) {
    return res.status(400).json({ message: "Username and password are required." }); // Return 404 invalid user credential
  }

  // Check if the user does not already exist
  if ( !isValid( username ) ) {
    // Hash the user's password before storing it
    const hashedPassword = await bcrypt.hash( password, 10 ); // Use a salt round of 10

    // Add the new user to the users array with hashed password
    users.push({ username, password: hashedPassword });
    
    console.log(`User ${username} registered successfully.`); // Debugging statement

    return res.status(201).json({ message: "User successfully registered. Now you can login." }); // Return 201 user registration is successful
  } else {
    return res.status(409).json({ message: "User already exists!" }); // Return 201 user exist
  }
});

//---- GET request: Retrieve all book list available in the online store
guest_users.get('/',function (req, res) {
  // Validate if book collection contain values
  if ( Object.keys( books ).length === 0) {
    return res.status(404).json({ message: `No books found!` }); // Return 404 if not found
  }
  
  // Send JSON response with formatted books collection to the Client
  res.send(JSON.stringify( books, null, 4 ));
});

// GET request: book details based on ISBN
guest_users.get('/isbn/:isbn', function (req, res) {
  // Retrieve the isbn from the request parameters
  const isbn = req.params.isbn.trim(); // Trim any whitespace

  // Validate that the isbn exists in the request parameters
  if (!isbn) {
    return res.status(400).json({ message: "ISBN is required." });
  }

  // Find the book by matching the isbn
  const book = Object.values( books ).find( book => book.isbn === isbn );

  // Validate that the book with the given ISBN exists
  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }
  
  res.status(200).json( book ); // Return a success response with the book information
});


//---- GET request: book details based on author
guest_users.get('/author/:author',function (req, res) {
  // Retrieve the author name from the request parameters
  const author = req.params.author;

  // Validate that the isbn exists in the request parameters
  if ( !author ) {
    return res.status(400).json({ message: "Author name is required." });
  }

  // Search for the book based on the author name
  const book = Object.values( books ).find( book => book.author === author );

  // Validate that the book with author name exists in the request parameters
  if ( !book ) {
    return res.status(400).json({ message: `Book with author name: ${author} not found!` });
  }

  res.status(200).json(book); // Return a success response with the book information
});


//---- GET request: Get all books based on title
guest_users.get('/title/:title',function (req, res) {
  // Retrieve the title from the request parameters
  const title = req.params.title;

  // Validate that the isbn exists in the request parameters
  if ( !title ) {
    return res.status(400).json({ message: "Title is required." });
  }

  // Find the book by matching the title
  const book = Object.values( books ).find( book => book.title === title); // Directly access the friend using the email as a key

  // Validate that the book with author name exists in the request parameters
  if (!book) {
    return res.status(400).json({ message: `Book with author name: ${title} not found!` });
  }

  res.status(200).json( book ); // Return a success response with the book information
});


//---- GET request:  Get book review
guest_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn.trim();

   // Validate that the isbn exists in the request parameters
  if ( !isbn ) {
    return res.status(400).json({ message: "ISBN is required." });
  }

  // Find the book by matching the isbn
  const book = Object.values( books ).find( book => book.isbn === isbn); // Directly access the friend using the email as a key

  if ( !book ) {
    return res.status(404).json({ message: `Book with ${isbn} not found.` });
  }

  return res.status(200).json( book.reviews );
});

module.exports.guest = guest_users;

