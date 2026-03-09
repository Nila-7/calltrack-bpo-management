export type EntityType = 
  | 'PERSON_NAME'
  | 'DATE_OF_BIRTH'
  | 'PAN_NUMBER'
  | 'AADHAAR_NUMBER'
  | 'ADDRESS'
  | 'EMAIL'
  | 'PHONE'
  | 'BANK_ACCOUNT'
  | 'IFSC_CODE'
  | 'ACCESS_LEVEL'
  | 'EMPLOYEE_ID';

export interface DetectedEntity {
  entityType: EntityType;
  key: string;
  originalValue: string;
  decoyValue: string;
  confidence: number;
  lineIndex: number; // For structure-preserving replacement
}

const KEY_MAP: Record<string, EntityType> = {
  'Full Name': 'PERSON_NAME',
  'Name': 'PERSON_NAME',
  'Date of Birth': 'DATE_OF_BIRTH',
  'DOB': 'DATE_OF_BIRTH',
  'PAN': 'PAN_NUMBER',
  'PAN Number': 'PAN_NUMBER',
  'Government ID (PAN)': 'PAN_NUMBER',
  'Permanent Account Number': 'PAN_NUMBER',
  'Aadhaar Number': 'AADHAAR_NUMBER',
  'Aadhaar': 'AADHAAR_NUMBER',
  'Address': 'ADDRESS',
  'Email': 'EMAIL',
  'Phone Number': 'PHONE',
  'Phone': 'PHONE',
  'Bank Name': 'BANK_ACCOUNT',
  'Bank': 'BANK_ACCOUNT',
  'Account Number': 'BANK_ACCOUNT',
  'IFSC Code': 'IFSC_CODE',
  'IFSC': 'IFSC_CODE',
  'Access Level': 'ACCESS_LEVEL',
  'Employee ID': 'EMPLOYEE_ID',
};

export function detectEntities(text: string): DetectedEntity[] {
  const lines = text.split('\n');
  const results: DetectedEntity[] = [];
  
  // PAN Pattern: 5 letters, 4 digits, 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  lines.forEach((line, index) => {
    if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      let entityType = KEY_MAP[key];

      // Fallback: Detection based on pattern if label doesn't directly match
      if (!entityType && panRegex.test(value)) {
        entityType = 'PAN_NUMBER';
      }

      if (entityType) {
        results.push({
          entityType: entityType,
          key: key,
          originalValue: value,
          decoyValue: '', // Will be filled by generator
          confidence: 1.0,
          lineIndex: index,
        });
      }
    }
  });

  return results;
}
