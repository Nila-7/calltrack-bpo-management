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
  // CRITICAL: Employee ID must remain identical in both documents
  EMPLOYEE_ID: (original) => original,
  
  PERSON_NAME: (original) => DECOY_TEMPLATES[original] || 'Rohit Srivastava',
  
  DATE_OF_BIRTH: (original) => {
    // Specific replacement for the user example
    if (original.includes('14 August 1993')) return '18 July 1992';
    // Generic shift for others
    return original.replace('199', '198').replace('200', '199');
  },
  
  PAN_NUMBER: (original) => {
    // Pattern: 5 letters, 4 digits, 1 letter (AAAAA9999A)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetters = (len: number) => Array.from({length: len}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const randomDigits = (len: number) => Array.from({length: len}, () => Math.floor(Math.random() * 10)).join('');
    
    return `${randomLetters(5)}${randomDigits(4)}${randomLetters(1)}`;
  },
  
  AADHAAR_NUMBER: (original) => {
    if (original === '4512 9087 3342') return '4781 5564 2109';
    return '4781 5564 ' + Math.floor(1000 + Math.random() * 8999 + 1000);
  },
  
  EMAIL: () => 'decoy.' + Math.random().toString(36).substring(7) + '@secure-mail.com',
  
  PHONE: () => '+91 9988776655',
  
  IFSC_CODE: () => 'ICIC0000981',
  
  BANK_ACCOUNT: () => '00980100456' + Math.floor(100 + Math.random() * 899),
  
  ADDRESS: (original) => DECOY_TEMPLATES[original] || 'Pune, Maharashtra, India',
  
  ACCESS_LEVEL: (original) => {
    if (original.includes('Level-3')) return original.replace('Level-3', 'Level-2');
    if (original.includes('Level-2')) return original.replace('Level-2', 'Level-1');
    return 'Level-0 Infrastructure';
  },
};

export function generateDecoyValue(entity: DetectedEntity): string {
  const generator = FAKE_GENERATORS[entity.entityType];
  return generator ? generator(entity.originalValue) : entity.originalValue;
}

export function generateDecoyDocument(text: string, entities: DetectedEntity[]): string {
  const lines = text.split('\n');
  const entityMap = new Map(entities.map(e => [e.lineIndex, e]));

  const resultLines = lines.map((line, index) => {
    const entity = entityMap.get(index);
    if (entity) {
      const decoy = generateDecoyValue(entity);
      
      // Preserve document structure by splitting at the first colon
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        // keyPart includes the label and the colon
        const keyPart = line.substring(0, colonIndex + 1);
        const originalValuePart = line.substring(colonIndex + 1);
        
        // Preserve original leading/trailing whitespace around the value
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
