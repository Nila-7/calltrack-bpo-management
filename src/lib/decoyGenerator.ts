import { DetectedEntity, EntityType } from './entityDetector';

const DECOY_TEMPLATES: Record<string, string> = {
  'Rahul Srinivasan': 'Rohit Srivastava',
  'John Doe': 'James Miller',
  'HDFC Bank': 'ICICI Bank',
  'ICICI Bank': 'Axis Bank',
  'Level-3': 'Level-2',
  'Level-2': 'Level-1',
};

const FAKE_GENERATORS: Record<EntityType, (original: string) => string> = {
  // CRITICAL: Employee ID must remain identical.
  EMPLOYEE_ID: (original) => original,
  
  PERSON_NAME: (original) => DECOY_TEMPLATES[original] || 'Rohit Srivastava',
  
  DATE_OF_BIRTH: (original) => {
    if (original.includes('14 August 1993')) return '18 July 1992';
    return original.replace('199', '198').replace('200', '199');
  },
  
  PAN_NUMBER: (original) => {
    if (original === 'BQTPS9172M') return 'ABTPS7421L';
    // Pattern: AAAAA9999A
    return 'ABTPS' + Math.floor(1000 + Math.random() * 8999) + 'L';
  },
  
  AADHAAR_NUMBER: (original) => {
    if (original === '4512 9087 3342') return '4781 5564 2109';
    return '4781 5564 ' + Math.floor(1000 + Math.random() * 8999);
  },
  
  EMAIL: (original) => {
    if (original.includes('rahul.srinivasan')) return original.replace('rahul.srinivasan', 'rohit.srivastava');
    return 'rohit.srivastava@oriontech.in';
  },
  
  PHONE: (original) => {
    if (original.includes('98451 22376')) return '+91 97162 88413';
    return '+91 97162 88413';
  },
  
  IFSC_CODE: (original) => {
    if (original === 'HDFC0001426') return 'ICIC0000981';
    return 'ICIC0000981';
  },
  
  BANK_ACCOUNT: (original) => {
    if (original === '50200087349122') return '00980100456123';
    if (original.length > 10) return '00980100456123';
    return original;
  },
  
  ADDRESS: (original) => {
    if (original.includes('Velachery')) return 'Sector 62, Noida – 201309';
    if (original.includes('Chennai')) return 'Uttar Pradesh, India';
    if (original.includes('No. 42')) return 'Flat 21B, Lakeview Apartments';
    if (original.includes('Tamil Nadu')) return 'Uttar Pradesh, India';
    return 'Flat 21B, Lakeview Apartments, Sector 62, Noida';
  },
  
  ACCESS_LEVEL: (original) => {
    if (original.includes('Level-3')) return original.replace('Level-3', 'Level-2');
    if (original.includes('Level-2')) return original.replace('Level-2', 'Level-1');
    return 'Level-0 Restricted';
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
      
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        // Handle Key: Value structure
        const keyPart = line.substring(0, colonIndex + 1);
        const originalValuePart = line.substring(colonIndex + 1);
        
        const match = originalValuePart.match(/^(\s*)(.*?)(\s*)$/);
        const leadingSpace = match?.[1] || ' ';
        const trailingSpace = match?.[3] || '';
        
        return `${keyPart}${leadingSpace}${decoy}${trailingSpace}`;
      } else {
        // Handle multi-line structures without colons (e.g. Address lines)
        const match = line.match(/^(\s*)(.*?)(\s*)$/);
        const leadingSpace = match?.[1] || '';
        const trailingSpace = match?.[3] || '';
        return `${leadingSpace}${decoy}${trailingSpace}`;
      }
    }
    return line;
  });

  return resultLines.join('\n');
}
