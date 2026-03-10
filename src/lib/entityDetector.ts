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
  'Corporate Email': 'EMAIL',
  'Email': 'EMAIL',
  'Contact Number': 'PHONE',
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
  
  // Pattern-based detection regex
  const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
  const aadhaarRegex = /\d{4}\s\d{4}\s\d{4}/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /\+91\s\d{5}\s\d{5}/;

  let addressLinesRemaining = 0;

  lines.forEach((line, index) => {
    // Detect multi-line address headers
    if (line.trim() === 'Registered Address' || line.startsWith('Address:')) {
      addressLinesRemaining = 4; // Capture next few lines as address lines
      if (!line.includes(':')) return; // Just a heading line, skip entity creation for it
    }

    if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      let entityType = KEY_MAP[key];

      // Fallback: Pattern-based detection if label doesn't match
      if (!entityType) {
        if (panRegex.test(value)) entityType = 'PAN_NUMBER';
        else if (aadhaarRegex.test(value)) entityType = 'AADHAAR_NUMBER';
        else if (emailRegex.test(value)) entityType = 'EMAIL';
        else if (phoneRegex.test(value)) entityType = 'PHONE';
      }

      // CRITICAL: Employee ID must never be added to detection results for replacement
      if (entityType === 'EMPLOYEE_ID' || key.toLowerCase().includes('employee id')) {
        return;
      }

      if (entityType) {
        results.push({
          entityType: entityType,
          key: key,
          originalValue: value,
          decoyValue: '', // Filled later
          confidence: 1.0,
          lineIndex: index,
        });
        return;
      }
    }

    // Handle address lines without colons following a Registered Address heading
    if (addressLinesRemaining > 0 && line.trim().length > 0 && !line.includes(':')) {
      results.push({
        entityType: 'ADDRESS',
        key: 'Address Component',
        originalValue: line.trim(),
        decoyValue: '',
        confidence: 0.8,
        lineIndex: index,
      });
      addressLinesRemaining--;
    }
  });

  return results;
}
