/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "firebase/firestore" {
  export function collection(...args: any[]): any;
  export function doc(...args: any[]): any;
  export function query(...args: any[]): any;
  export function where(...args: any[]): any;
  export function onSnapshot(...args: any[]): any;
  export function orderBy(...args: any[]): any;
  export function getDocs(...args: any[]): any;
  export function getDoc(...args: any[]): any;
  export function addDoc(...args: any[]): any;
  export function setDoc(...args: any[]): any;
  export function updateDoc(...args: any[]): any;
  export function deleteDoc(...args: any[]): any;
  export function writeBatch(...args: any[]): any;
  export function runTransaction(...args: any[]): any;
  export function serverTimestamp(...args: any[]): any;
  export function increment(...args: any[]): any;
  export function arrayUnion(...args: any[]): any;
  export function arrayRemove(...args: any[]): any;
  export const Timestamp: any;
  export const GeoPoint: any;
  export const FieldValue: any;
  export function initializeFirestore(...args: any[]): any;
  export function getFirestore(...args: any[]): any;
  export function persistentLocalCache(...args: any[]): any;
  export function persistentMultipleTabManager(...args: any[]): any;
  export function limit(...args: any[]): any;
  export function startAfter(...args: any[]): any;
  export function endBefore(...args: any[]): any;
  export function getCountFromServer(...args: any[]): any;
  export function connectFirestoreEmulator(...args: any[]): any;
}

declare module "firebase/auth" {
  export function getAuth(...args: any[]): any;
  export function signInWithEmailAndPassword(...args: any[]): any;
  export function createUserWithEmailAndPassword(...args: any[]): any;
  export function signInWithPopup(...args: any[]): any;
  export function signInWithRedirect(...args: any[]): any;
  export function signOut(...args: any[]): any;
  export function onAuthStateChanged(...args: any[]): any;
  export function sendPasswordResetEmail(...args: any[]): any;
  export function confirmPasswordReset(...args: any[]): any;
  export function verifyPasswordResetCode(...args: any[]): any;
  export function updateProfile(...args: any[]): any;
  export const GoogleAuthProvider: any;
  export function RecaptchaVerifier(...args: any[]): any;
  export function linkWithPhoneNumber(...args: any[]): any;
  export const PhoneAuthProvider: any;
  export function reauthenticateWithCredential(...args: any[]): any;
  export const EmailAuthProvider: any;
  export function connectAuthEmulator(...args: any[]): any;
  export function getIdToken(...args: any[]): any;
}

declare module "firebase/functions" {
  export function getFunctions(...args: any[]): any;
  export function httpsCallable(...args: any[]): any;
  export function connectFunctionsEmulator(...args: any[]): any;
}

declare module "firebase/storage" {
  export function getStorage(...args: any[]): any;
  export function ref(...args: any[]): any;
  export function uploadBytes(...args: any[]): any;
  export function uploadBytesResumable(...args: any[]): any;
  export function getDownloadURL(...args: any[]): any;
  export function deleteObject(...args: any[]): any;
  export function listAll(...args: any[]): any;
  export function connectStorageEmulator(...args: any[]): any;
}

declare module "firebase/app" {
  export function initializeApp(...args: any[]): any;
  export function getApps(...args: any[]): any;
  export function getApp(...args: any[]): any;
}
