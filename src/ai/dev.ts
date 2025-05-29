
import { config } from 'dotenv';
config();

import '@/ai/flows/symptom-analysis-flow.ts';
import '@/ai/flows/find-doctors-flow.ts'; 
import '@/ai/flows/extract-health-data-from-document-flow.ts';
import '@/ai/flows/analyze-extracted-health-data-flow.ts';
import '@/ai/flows/analyze-xray-image-flow.ts';
import '@/ai/flows/app-guide-chatbot-flow.ts'; // Added chatbot flow
