import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const authService = {
  // Register new user
  async register(email, password, displayName, preferences = {}) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile
      await updateProfile(user, { displayName });

      // Send email verification
      await sendEmailVerification(user);

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        profilePhoto: null,
        preferences: {
          language: preferences.language || 'en',
          darkMode: preferences.darkMode ?? false,
          treeDefaultView: preferences.treeDefaultView || 'radial',
          notificationEnabled: preferences.notificationEnabled ?? true,
          ...preferences,
        },
        invitedBy: null,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        isDeleted: false,
        deletedAt: null,
        emailVerified: false, // Track verification status
      });

      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Login user
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Update last login
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        lastLogin: new Date().toISOString()
      }, { merge: true });

      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Logout user
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Get current user data from Firestore
  async getCurrentUserData() {
    if (!auth.currentUser) return null;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Update email verification status in Firestore if it has changed
        if (auth.currentUser.emailVerified !== userData.emailVerified) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            emailVerified: auth.currentUser.emailVerified,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          userData.emailVerified = auth.currentUser.emailVerified;
        }
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  },

  // Login with Google
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Unknown',
          profilePhoto: user.photoURL || null,
          preferences: {
            language: 'en',
            darkMode: false,
            treeDefaultView: 'radial',
            notificationEnabled: true,
          },
          invitedBy: null,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          isDeleted: false,
          deletedAt: null,
        });
      } else {
        // Update last login
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }

      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  },

  // Resend email verification
  async resendEmailVerification() {
    try {
      if (!auth.currentUser) {
        throw new Error('No user is currently signed in');
      }

      await sendEmailVerification(auth.currentUser);
      return { success: true, message: 'Verification email sent successfully' };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Check if current user is email verified
  isCurrentUserEmailVerified() {
    return auth.currentUser?.emailVerified || false;
  }
};
