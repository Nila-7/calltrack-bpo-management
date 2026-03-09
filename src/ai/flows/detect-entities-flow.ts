'use server';
/**
 * @fileOverview A flow for detecting sensitive entities in documents.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EntitySchema = z.object({
  entity_type: z.enum([
    'PERSON_NAME',
    'DATE_OF_BIRTH',
    'PAN_NUMBER',
    'AADHAAR_NUMBER',
    'EMAIL',
    'PHONE',
    'ADDRESS',
    'BANK_ACCOUNT',
    'IFSC_CODE',
    'EMPLOYEE_ID',
    'ACCESS_LEVEL',
  ]),
  original: z.string(),
  decoy: z.string(),
  confidence: z.number(),
  startIndex: z.number(),
  endIndex: z.number(),
});

const DetectEntitiesInputSchema = z.object({
  text: z.string(),
});

const DetectEntitiesOutputSchema = z.object({
  entities: z.array(EntitySchema),
});

export type EntityResult = z.infer<typeof EntitySchema>;
export type DetectEntitiesOutput = z.infer<typeof DetectEntitiesOutputSchema>;

export async function detectEntitiesAction(input: { text: string }): Promise<DetectEntitiesOutput> {
  return detectEntitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectEntitiesPrompt',
  input: { schema: DetectEntitiesInputSchema },
  output: { schema: DetectEntitiesOutputSchema },
  prompt: `You are a cybersecurity expert specializing in PII (Personally Identifiable Information) detection and document deception.
  
  Scan the following text and identify all sensitive entities. For each entity, suggest a realistic but fake DECOY value.
  Maintain the exact start and end character indices of the original values in the text.

  Categories to detect:
  - PERSON_NAME
  - DATE_OF_BIRTH
  - PAN_NUMBER (Format: 5 letters, 4 digits, 1 letter)
  - AADHAAR_NUMBER (Format: 12 digits, space separated every 4)
  - EMAIL
  - PHONE
  - ADDRESS
  - BANK_ACCOUNT
  - IFSC_CODE
  - EMPLOYEE_ID
  - ACCESS_LEVEL (e.g., Level-1, Level-2, Level-3)

  Text to analyze:
  """
  {{{text}}}
  """`,
});

const detectEntitiesFlow = ai.defineFlow(
  {
    name: 'detectEntitiesFlow',
    inputSchema: DetectEntitiesInputSchema,
    outputSchema: DetectEntitiesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
