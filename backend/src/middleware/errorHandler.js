// errorHandler.js — Custom error class + async wrapper utility
//
// WHY A CUSTOM ERROR CLASS?
// JavaScript's built-in Error only has a message.
// We need HTTP status codes too (404, 400, 401, etc.)
// AppError extends Error to add statusCode.
//
// WHY catchAsync?
// Every async route handler that throws will crash the server
// unless you wrap it in try/catch and call next(error).
// catchAsync does that wrapping for you so routes stay clean.

// Custom error class — extends the built-in Error
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);           // Set the error message
    this.statusCode = statusCode; // Attach HTTP status code
    this.isOperational = true;    // Flag: "this is expected, not a bug"
    Error.captureStackTrace(this, this.constructor); // Clean stack trace
  }
}

// catchAsync — wraps any async route handler
// Instead of:
//   async (req, res, next) => { try { ... } catch(e) { next(e) } }
// You write:
//   catchAsync(async (req, res, next) => { ... })
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // If the promise rejects, pass error to Express
  };
};
