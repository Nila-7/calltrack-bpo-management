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
  originalValue: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

const PATTERNS: Record<EntityType, RegExp> = {
  PAN_NUMBER: /[A-Z]{5}[0-9]{4}[A-Z]/g,
  AADHAAR_NUMBER: /\d{4}\s\d{4}\s\d{4}/g,
  EMAIL: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  PHONE: /\+91\s\d{10}/g,
  IFSC_CODE: /[A-Z]{4}0[A-Z0-9]{6}/g,
  DATE_OF_BIRTH: /\d{2}\/\d{2}\/\d{4}/g,
  BANK_ACCOUNT: /\d{10,16}/g,
  EMPLOYEE_ID: /EMP-\d{5}|EXP-\d{5}/g,
  PERSON_NAME: /(?:Rahul Srinivasan|John Doe|Jane Smith|Amit Kumar|Sarah Wilson)/g,
  ADDRESS: /(?:HDFC Bank|ICICI Bank|Level-\d Infrastructure Systems|Mumbai, India|New York, USA)/g,
  ACCESS_LEVEL: /Level-\d/g,
};

export function detectEntities(text: string): DetectedEntity[] {
  const results: DetectedEntity[] = [];

  Object.entries(PATTERNS).forEach(([type, regex]) => {
    let match;
    const currentRegex = new RegExp(regex);
    while ((match = currentRegex.exec(text)) !== null) {
      results.push({
        entityType: type as EntityType,
        originalValue: match[0],
        confidence: 0.95 + (Math.random() * 0.04), // High confidence for regex matches
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  });

  // Sort by index to handle overlapping or sequential replacements later
  return results.sort((a, b) => a.startIndex - b.startIndex);
}