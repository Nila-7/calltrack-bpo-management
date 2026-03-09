'use client';

import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type SystemAction = 
  | 'User authenticated'
  | 'Admin authenticated'
  | 'User registered'
  | 'Document uploaded'
  | 'Document accessed'
  | 'Document deleted'
  | 'Decoy activated'
  | 'Unauthorized access attempt';

export interface ActivityLog {
  userId: string;
  userEmail: string;
  action: SystemAction;
  documentId?: string;
  fileName?: string;
  timestamp: any;
  status: 'Success' | 'Warning' | 'Alert';
  metadata?: any;
}

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
