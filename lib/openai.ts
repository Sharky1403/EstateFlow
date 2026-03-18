import OpenAI from 'openai'
import type { TicketUrgency, TicketCategory } from '@/types/database'

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function triageMaintenanceTicket(
  description: string
): Promise<{ urgency: TicketUrgency; category: TicketCategory }> {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a property maintenance classifier. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: `Classify this maintenance issue: "${description}". 
        Return JSON: { "urgency": "emergency" | "routine", "category": "plumbing" | "electrical" | "hvac" | "other" }`,
      },
    ],
    response_format: { type: 'json_object' },
  })
  return JSON.parse(response.choices[0].message.content!) as {
    urgency: TicketUrgency
    category: TicketCategory
  }
}
