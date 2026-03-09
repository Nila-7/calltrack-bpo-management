'use client';

import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type SystemAction = 
  | 'User Login'
  | 'User Logout'
  | 'Admin Login'
  | 'User Created'
  | 'User Deleted'
  | 'Document Uploaded'
  | 'Document Opened'
  | 'Document Deleted'
  | 'Document Viewed'
  | 'Decoy Activated'
  | 'Simulated Breach Triggered'
  | 'Unauthorized Access Attempt'
  | 'System Alert Triggered';

export interface ActivityLog {
  userId: string;
  userEmail: string;
  role: 'admin' | 'user';
  action: SystemAction;
  documentId?: string;
  documentName?: string;
  timestamp: any;
  status: 'Success' | 'Warning' | 'Alert';
  metadata?: any;
}

/**
 * Logs a system activity to Firestore.
 * Ensures every log is tied to a user identity and role.
 */
export async function logActivity(
  db: Firestore,
  log: Omit<ActivityLog, 'timestamp'>
) {
  const colRef = collection(db, 'activity_logs');
  const logData = {
    ...log,
    timestamp: serverTimestamp(),
  };

  addDoc(colRef, logData).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: logData,
      })
    );
  });
}

/**
 * Creates or updates a session record in Firestore.
 */
export async function trackSession(
  db: Firestore,
  session: {
    userId: string;
    email: string;
    role: 'admin' | 'user';
    isActive: boolean;
  }
) {
  const colRef = collection(db, 'sessions');
  const sessionData = {
    ...session,
    loginTime: serverTimestamp(),
    lastActivityTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  addDoc(colRef, sessionData).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: sessionData,
      })
    );
  });
}
