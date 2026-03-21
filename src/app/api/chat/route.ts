import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: `You are the friendly, helpful AI Assistant for "Nanu's World", a digital scrapbook blog created by Nanu's Dad. 
Answer questions about Nanu's adventures, stories, and background based on common sense or ask for more context.
If the user wants to send a message, feedback, or their contact info to Nanu's Dad, ALWAYS use the \`sendUserData\` tool to do it! Be enthusiastic and polite.`,
    messages,
    tools: {
      sendUserData: tool({
        description: 'Sends a name, message, and email to the backend endpoint so Dad can read it.',
        parameters: z.object({
          name: z.string().describe('The name of the user leaving the message.'),
          email: z.string().email().optional().describe('The email address of the user (if provided).'),
          message: z.string().describe('The actual message or feedback meant for Dad or Nanu.'),
        }),
        // @ts-ignore
        execute: async ({ name, email, message }) => {
          try {
            // Internal call to our data endpoint
            const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, message, source: 'ai-agent' })
            });
            if (res.ok) {
              return "Data successfully sent to the endpoint!";
            }
            return "Endpoint returned an error.";
          } catch (e) {
            return "Failed to connect to the data endpoint.";
          }
        },
      }),
    },
    maxSteps: 3, // Allow the model to call the tool and then respond to the user
  } as any);

  return result.toTextStreamResponse();
}
