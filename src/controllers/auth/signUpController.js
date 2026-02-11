import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorHandler';

export async function handleSignUp(formData, navigate, onError, setLoading) {
  try {
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (!formData.termsAccepted) {
      throw new Error('You must accept the terms of use and privacy policy.');
    }

    // Call auth service
  await authService.register(formData.email, formData.password, formData.displayName, {
      language: formData.language,
    });

    // Check if there's a pending join invite to resume after verification
    const pendingInvite = sessionStorage.getItem('pendingJoinInvite');
    if (pendingInvite) {
      // Store flag to indicate we need to redirect to join after verification
      sessionStorage.setItem('redirectToJoinAfterVerification', 'true');
    }

    // Navigate to email verification
    navigate('/verify-email');

  } catch (err) {
    const userFriendlyMessage = getErrorMessage(err);
    onError(userFriendlyMessage);
    throw err;
  } finally {
    setLoading(false);
  }
}

export async function handleGoogleSignUp(navigate, onError, setLoading) {
  try {
    setLoading(true);

    // Call auth service for Google sign up
  await authService.loginWithGoogle();

    // Navigate on success
    navigate('/my-trees');

  } catch (err) {
    const userFriendlyMessage = getErrorMessage(err);
    onError(userFriendlyMessage);
    throw err;
  } finally {
    setLoading(false);
  }
}
