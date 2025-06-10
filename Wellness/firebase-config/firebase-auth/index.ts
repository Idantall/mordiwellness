import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import { Account, AccountRegisterCredentionals, CategoryDocument } from 'types';
import * as Crypto from 'expo-crypto';
import { readAllDocuments } from '../firebase-generic';

// PhoneAuthProvider is directly available from auth in React Native Firebase
export const phoneProvider = auth.PhoneAuthProvider;

function configureAuthSettings() {
    const settings: FirebaseAuthTypes.AuthSettings = {
        appVerificationDisabledForTesting: false,
        forceRecaptchaFlowForTesting: false,
        setAutoRetrievedSmsCodeForPhoneNumber: () => null
    }
    auth().settings = settings;
}

configureAuthSettings();

// Function to observe authentication state
export function ObserveAuthState(observer: (user: any) => any) {
    return auth().onAuthStateChanged(observer);
}

export async function signOut() {
    return await auth().signOut()
}

interface AccountRegisterCredentionalsWithId extends AccountRegisterCredentionals {
    id: string,
}

export const deleteOldProfilePicture = async (userId: string) => {
    const userDoc = await firestore().doc(userId).get();
    if (!userDoc.exists) throw new Error("invalid user id");
    const userData: FirebaseFirestoreTypes.DocumentData = userDoc.data();
    if (userData.profilePictureUrl && userData.profilePictureUrl.startsWith("https")) {
        const storageRef = storage().refFromURL(userData.profilePictureUrl);
        await storageRef.delete();
    }
}

// Function to upload profile picture to firebase cloud storage unit
export const uploadProfilePicture = async (uri: string) => {
    if (!uri) return null;

    try {
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      console.log('Uploading file:', filename);

      const fileUri = decodeURIComponent(uri); // Decode URI if necessary
      const storageRef = storage().ref(`profilePictures/${filename}`);
      const task = storageRef.putFile(fileUri);

      return new Promise<string>((resolve, reject) => {
        task.on(
          'state_changed',
          (snapshot) => {
            console.log('Progress:', (snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await storageRef.getDownloadURL();
              console.log('File available at:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      throw error;
    }
  };

// Function to create a Firestore user
export async function createFirestoreUser(data: AccountRegisterCredentionalsWithId): Promise<Account> {
    try {
        const createdAt = new Date(Date.now());
        const updatedAt = new Date(Date.now());
        let defaultCategories = await readAllDocuments<Partial<CategoryDocument>[]>('initial-categories');
        defaultCategories = defaultCategories.map(category => ({ ...category, id: Crypto.randomUUID(), active: false }));
        const userRef = firestore().collection('users').doc(data.id);
        await userRef.set({ ...data, createdAt, updatedAt, categories: defaultCategories, goals: [], new: true, disabled: false });
        const userData: Account = { ...data, createdAt, updatedAt, categories: defaultCategories as CategoryDocument[], goals: [], new: true, disabled: false, currentMood: null, }
        return userData;
    } catch (err) {

        throw err;
    }
}

// Function to get a Firestore user
export async function getFirestoreUser(userId: string) {
    try {
        const userDoc = await firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
            return userDoc.data() as Account;
        } else {
            throw new Error('User not found');
        }
    } catch (err) {
        throw err;
    }
}

export async function doesUserExist(phoneNumber: string): Promise<boolean> {
    const snapshot = await firestore().collection("users").where("phoneNumber", "==", phoneNumber).limit(1).get();
    return !snapshot.empty;
}

export async function updateCurrentUser(credentials: Partial<AccountRegisterCredentionalsWithId>): Promise<Partial<AccountRegisterCredentionalsWithId>> {
    try {
        const { id, profilePictureUrl, ...other } = credentials;
        const updatedProfilePictureUrl = !profilePictureUrl.startsWith("https://") ? await uploadProfilePicture(profilePictureUrl) : profilePictureUrl;
        await firestore().collection("users").doc(id).update({ ...other, profilePictureUrl: updatedProfilePictureUrl })
        return {
            ...other,
            profilePictureUrl: updatedProfilePictureUrl,
            id
        }
    } catch (err) {
        throw err;
    }
}
