'use server';
/**
 * @fileOverview An AI flow to find fictional doctor profiles based on location (Indian state) and specialty/symptoms.
 *
 * - findDoctorsFlow - A function that generates a list of fictional doctor profiles.
 * - FindDoctorsInput - The input type for the findDoctorsFlow function.
 * - FindDoctorsOutput - The return type for the findDoctorsFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DoctorProfileSchema = z.object({
  id: z.string().describe("A unique ID for the doctor profile, e.g., 'doc-1'"),
  name: z.string().describe("The doctor's full name, using common Indian names."),
  specialty: z.string().describe("The medical specialty of the doctor (e.g., General Practitioner, Cardiologist, Pediatrician)."),
  address: z.string().describe("A plausible clinic address within the specified Indian state. Include city and a general area."),
  phoneNumber: z.string().default("8446204947").describe("A contact phone number. For simulation, use 8446204947."),
  availabilityNotes: z.string().optional().describe("Brief notes on availability or services, e.g., 'Mon-Fri, 10 AM - 6 PM' or 'Teleconsultation offered'.")
});
export type DoctorProfile = z.infer<typeof DoctorProfileSchema>;


const FindDoctorsInputSchema = z.object({
  indianState: z
    .string()
    .describe('The Indian state where the user is looking for a doctor (e.g., "Maharashtra", "Tamil Nadu", "Uttar Pradesh").'),
  symptomOrSpecialty: z
    .string()
    .describe('A description of symptoms (e.g., "fever and cough", "chest pain") or the desired medical specialty (e.g., "Pediatrician", "Dermatologist").'),
});
export type FindDoctorsInput = z.infer<typeof FindDoctorsInputSchema>;

const FindDoctorsOutputSchema = z.object({
  doctors: z.array(DoctorProfileSchema).min(1).max(3).describe("A list of 2 to 3 fictional doctor profiles matching the criteria. Ensure names and addresses are plausible for the given Indian state.")
});
export type FindDoctorsOutput = z.infer<typeof FindDoctorsOutputSchema>;


export async function findDoctors(input: FindDoctorsInput): Promise<FindDoctorsOutput> {
  return findDoctorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findDoctorsPrompt',
  input: {schema: FindDoctorsInputSchema},
  output: {schema: FindDoctorsOutputSchema},
  prompt: `You are an AI assistant helping users find fictional doctor profiles in India for illustrative purposes.
The user is looking for a doctor in the Indian state of: {{{indianState}}}.
The user's query for symptoms or specialty is: "{{{symptomOrSpecialty}}}".

Based on this, please:
1.  If symptoms are provided, infer the most relevant medical specialty (e.g., for "fever and sore throat", suggest "General Practitioner"; for "skin rash", suggest "Dermatologist"; for "heart palpitations", suggest "Cardiologist"). If a specialty is directly provided, use that.
2.  Generate 2 to 3 fictional doctor profiles.
3.  For each doctor:
    *   Assign a unique ID (e.g., "doc-1", "doc-2").
    *   Create a full name using common Indian names.
    *   Specify the inferred or given medical specialty.
    *   Create a plausible clinic address located within the specified Indian state. Include a city name relevant to that state and a general area or street name.
    *   Use the phone number "8446204947" for all profiles for this simulation.
    *   Optionally, add brief availability notes (e.g., "Mon-Sat, 9 AM - 5 PM", "Teleconsultation available").

Ensure the generated profiles are diverse and sound realistic for an Indian context. The primary goal is to provide illustrative examples.
Return the list of doctors in the specified output format.
`,
});

const findDoctorsFlow = ai.defineFlow(
  {
    name: 'findDoctorsFlow',
    inputSchema: FindDoctorsInputSchema,
    outputSchema: FindDoctorsOutputSchema,
  },
  async (input: FindDoctorsInput) => {
    const {output} = await prompt(input);
    if (!output || !output.doctors || output.doctors.length === 0) {
      // Fallback if AI fails to generate, though schema should enforce min 1.
      // This ensures the app doesn't crash if AI returns unexpected empty results.
      return {
        doctors: [{
          id: 'fallback-doc-1',
          name: 'Dr. Example (AI Fallback)',
          specialty: input.symptomOrSpecialty.includes('heart') ? 'Cardiologist' : input.symptomOrSpecialty.includes('child') ? 'Pediatrician' : 'General Practitioner',
          address: `Central Clinic, A City, ${input.indianState}`,
          phoneNumber: "8446204947",
          availabilityNotes: "Please verify details independently."
        }]
      };
    }
    // Ensure phone number is set for all generated doctors
    output.doctors = output.doctors.map(doc => ({...doc, phoneNumber: "8446204947"}));
    return output;
  }
);
