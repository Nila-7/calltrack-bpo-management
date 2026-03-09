import { DetectedEntity } from './entityDetector';

const DECOY_MAP: Record<string, string> = {
  'Rahul Srinivasan': 'Rohit Srivastava',
  'John Doe': 'James Miller',
  'Jane Smith': 'Janet Taylor',
  'Amit Kumar': 'Anil Sharma',
  'Sarah Wilson': 'Sandra Watson',
  'HDFC Bank': 'ICICI Bank',
  'ICICI Bank': 'Axis Bank',
  'Level-3': 'Level-2',
  'Level-2': 'Level-1',
  'Level-1': 'Level-0',
  'Mumbai, India': 'Pune, India',
  'New York, USA': 'Chicago, USA',
};

// Default fake patterns for regex types
const FAKE_PATTERNS: Record<string, () => string> = {
  PAN_NUMBER: () => 'ABTPS' + Math.floor(1000 + Math.random() * 9000) + 'L',
  AADHAAR_NUMBER: () => '4781 5564 ' + Math.floor(1000 + Math.random() * 8999 + 1000),
  EMAIL: () => 'decoy.' + Math.random().toString(36).substring(7) + '@secure-mail.com',
  PHONE: () => '+91 9988776655',
  IFSC_CODE: () => 'ICIC0000981',
  BANK_ACCOUNT: () => '00980100456' + Math.floor(100 + Math.random() * 899),
  EMPLOYEE_ID: () => 'EXP-' + Math.floor(10000 + Math.random() * 89999),
};

export function generateDecoyValue(entity: DetectedEntity): string {
  if (DECOY_MAP[entity.originalValue]) {
    return DECOY_MAP[entity.originalValue];
  }
  
  // Fuzzy match for addresses/access levels containing keywords
  for (const [key, value] of Object.entries(DECOY_MAP)) {
    if (entity.originalValue.includes(key)) {
      return entity.originalValue.replace(key, value);
    }
  }

  const generator = FAKE_PATTERNS[entity.entityType];
  return generator ? generator() : `[PROTECTED_${entity.entityType}]`;
}

export function generateDecoyDocument(text: string, entities: DetectedEntity[]): string {
  let offset = 0;
  let result = text;

  // Important: Iterate over sorted entities to maintain string index integrity
  entities.forEach((entity) => {
    const decoy = generateDecoyValue(entity);
    const start = entity.startIndex + offset;
    const end = entity.endIndex + offset;
    
    result = result.slice(0, start) + decoy + result.slice(end);
    offset += decoy.length - entity.originalValue.length;
  });

  return result;
}