import { DetectedEntity, EntityType } from './entityDetector';

const DECOY_TEMPLATES: Record<string, string> = {
  'Rahul Srinivasan': 'Rohit Srivastava',
  'John Doe': 'James Miller',
  'HDFC Bank': 'ICICI Bank',
  'ICICI Bank': 'Axis Bank',
  'Level-3': 'Level-2',
  'Level-2': 'Level-1',
  'Level-1': 'Level-0',
};

const FAKE_GENERATORS: Record<EntityType, (original: string) => string> = {
  // Requirement: Employee ID must remain identical in both documents
  EMPLOYEE_ID: (original) => original,
  PERSON_NAME: (original) => DECOY_TEMPLATES[original] || 'Rohit Srivastava',
  DATE_OF_BIRTH: (original) => {
    // Basic realistic DOB shift
    if (original.includes('August')) return original.replace('August', 'July').replace('1993', '1992').replace('14', '18');
    return '18 July 1992';
  },
  PAN_NUMBER: () => 'ABTPS' + Math.floor(1000 + Math.random() * 9000) + 'L',
  AADHAAR_NUMBER: () => '4781 5564 ' + Math.floor(1000 + Math.random() * 8999 + 1000),
  EMAIL: () => 'decoy.' + Math.random().toString(36).substring(7) + '@secure-mail.com',
  PHONE: () => '+91 9988776655',
  IFSC_CODE: () => 'ICIC0000981',
  BANK_ACCOUNT: () => '00980100456' + Math.floor(100 + Math.random() * 899),
  ADDRESS: (original) => DECOY_TEMPLATES[original] || 'Pune, India',
  ACCESS_LEVEL: (original) => {
    if (original.includes('Level-3')) return original.replace('Level-3', 'Level-2');
    if (original.includes('Level-2')) return original.replace('Level-2', 'Level-1');
    return 'Level-0';
  },
};

export function generateDecoyValue(entity: DetectedEntity): string {
  const generator = FAKE_GENERATORS[entity.entityType];
  return generator ? generator(entity.originalValue) : `[PROTECTED]`;
}

export function generateDecoyDocument(text: string, entities: DetectedEntity[]): string {
  const lines = text.split('\n');
  const entityMap = new Map(entities.map(e => [e.lineIndex, e]));

  const resultLines = lines.map((line, index) => {
    const entity = entityMap.get(index);
    if (entity) {
      const decoy = generateDecoyValue(entity);
      // Preserve key and colon, replace only value
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const keyPart = line.substring(0, colonIndex + 1);
        const originalValuePart = line.substring(colonIndex + 1);
        
        // Preserve original leading/trailing whitespace around the value if any
        const match = originalValuePart.match(/^(\s*)(.*?)(\s*)$/);
        const leadingSpace = match?.[1] || ' ';
        const trailingSpace = match?.[3] || '';
        
        return `${keyPart}${leadingSpace}${decoy}${trailingSpace}`;
      }
    }
    return line;
  });

  return resultLines.join('\n');
}
