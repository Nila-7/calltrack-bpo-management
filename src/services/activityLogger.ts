export type SystemAction = 
  | 'User authenticated'
  | 'User authentication failed'
  | 'Document uploaded'
  | 'Document accessed'
  | 'Document deleted'
  | 'Decoy activated'
  | 'Unauthorized access attempt';

export interface ActivityLog {
  id: string;
  user: string;
  action: SystemAction;
  document: string;
  timestamp: string;
  status: 'Success' | 'Warning' | 'Alert';
}

// In-memory mock for Firestore logs
let logs: ActivityLog[] = [
  { id: '1', user: 'admin@isx.com', action: 'User authenticated', document: 'N/A', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), status: 'Success' },
  { id: '2', user: 'user@isx.com', action: 'Document uploaded', document: 'Q3_Tax_Report.pdf', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'Success' },
];

export const activityLogger = {
  getLogs: () => [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  log: (action: SystemAction, user: string, document: string = 'N/A', status: 'Success' | 'Warning' | 'Alert' = 'Success') => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(7),
      user,
      action,
      document,
      timestamp: new Date().toISOString(),
      status
    };
    logs = [newLog, ...logs];
    return newLog;
  }
};