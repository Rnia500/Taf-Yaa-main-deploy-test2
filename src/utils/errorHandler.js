/**
 * Centralized error handling utility for mapping Firebase and other errors
 * to user-friendly messages without exposing system internals
 */

export const getErrorMessage = (error) => {
  console.log('Error handler received:', {
    code: error.code,
    message: error.message,
    name: error.name,
    hasCode: !!error.code,
    fullError: error
  });

  // Extract error code from message if code property is missing
  let errorCode = error.code;
  if (!errorCode && error.message) {
    // Extract code from message like "Firebase: Error (auth/invalid-credential)."
    const match = error.message.match(/Firebase: Error \(([^)]+)\)/);
    if (match) {
      errorCode = match[1];
      console.log('Extracted error code from message:', errorCode);
    }
  }

  // Handle Firebase Auth errors
  if (errorCode) {
    console.log('Processing Firebase error code:', errorCode);
    switch (errorCode) {
      // Authentication errors
      case 'auth/user-not-found':
        return 'Wrong credentials: please check your email and password';

      case 'auth/wrong-password':
        return 'Wrong credentials: please check your email and password';

      case 'auth/invalid-credential':
        return 'Wrong credentials: please check your email and password';

      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';

      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later.';

      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';

      case 'auth/invalid-email':
        return 'Invalid email format. Please enter a valid email address.';

      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';

      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';

      case 'auth/requires-recent-login':
        return 'This operation requires recent authentication. Please log in again.';

      case 'auth/email-not-verified':
        return 'Please verify your email address before continuing.';

      // Firestore errors
      case 'permission-denied':
        return 'You do not have permission to perform this action.';

      case 'not-found':
        return 'The requested resource was not found.';

      case 'already-exists':
        return 'This item already exists.';

      case 'resource-exhausted':
        return 'Service temporarily unavailable. Please try again later.';

      case 'failed-precondition':
        return 'Operation cannot be performed in the current state.';

      case 'aborted':
        return 'Operation was aborted. Please try again.';

      case 'out-of-range':
        return 'Invalid data provided.';

      case 'unimplemented':
        return 'This feature is not yet available.';

      case 'internal':
        return 'An internal error occurred. Please try again.';

      case 'unavailable':
        return 'Service is temporarily unavailable. Please try again later.';

      case 'data-loss':
        return 'Data could not be processed. Please try again.';

      case 'unauthenticated':
        return 'You must be logged in to perform this action.';

      case 'deadline-exceeded':
        return 'Request timed out. Please try again.';

      default:
        console.warn('Unhandled Firebase error code:', error.code, error.message);
        break;
    }
  }


  const message = error.message?.toLowerCase() || '';

  if (message.includes('network') || message.includes('connection')) {
    return 'Network error. Please check your internet connection.';
  }

  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'You do not have permission to perform this action.';
  }

  console.warn('Unhandled error:', error);
  return 'An error occurred. Please try again.';
};


export const handleAsyncOperation = async (operation, onError = null) => {
  try {
    return await operation();
  } catch (error) {
    const userFriendlyMessage = getErrorMessage(error);

    if (onError) {
      onError(userFriendlyMessage, error);
    } else {
      throw new Error(userFriendlyMessage);
    }
  }
};


export const withErrorHandling = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };
};
