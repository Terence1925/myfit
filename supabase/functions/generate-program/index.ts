// Supabase Edge Function: generate-program
// Deploy with `supabase functions deploy generate-program`.
// Requires an LLM API key set as an edge function secret (e.g. ANTHROPIC_API_KEY).
//
// POST body (generate):
//   { action: "generate", answers: IntakeAnswers, nutrition: NutritionPlan }
// POST body (alternate):
//   { action: "alternate", exerciseName: string, dayFocus: string, answers: IntakeAnswers }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

function experienceGuidance(experience: string): string {
  switch (experience) {
    case '0-1':
      return 'Beginner: low weekly volume, compound lifts only, simple linear progression, generous rest.'
    case '2-3':
      return 'Intermediate: moderate volume, double progression, some isolation work.'
    case '3-5':
      return 'Advanced: higher volume, more isolation and technique variation, RPE-based autoregulation.'
    default:
      return 'Elite (5+ years): full periodization, RPE/RIR-based programming, advanced techniques where appropriate.'
  }
}

async function callLLM(systemPrompt: string, userPrompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!res.ok) throw new Error(`LLM request failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const text = data.content?.[0]?.text ?? '{}'
  return JSON.parse(text)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const body = await req.json()

    if (body.action === 'alternate') {
      const { exerciseName, dayFocus, answers } = body
      const prompt = `The client is training with equipment: ${answers.equipment}. Their current exercise "${exerciseName}" (targeting ${dayFocus}) needs to be swapped for an equivalent exercise using only that equipment, respecting any injuries: ${answers.injuries}. Respond with ONLY JSON: {"name": string, "sets": number, "reps": string, "rest": string, "notes": string}.`
      const swap = await callLLM(
        'You are a certified strength coach. Respond with strict JSON only, no prose.',
        prompt,
      )
      return new Response(JSON.stringify(swap), {
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      })
    }

    const { answers, nutrition } = body

    const systemPrompt = `You are an elite strength & conditioning coach building a periodized training program. You MUST:
- Respect the client's equipment access strictly: ${answers.equipment}. Never program an exercise requiring equipment they don't have.
- Apply this experience-tier guidance: ${experienceGuidance(answers.experience)}
- Apply mandatory recovery-based volume rules from their recovery score of ${nutrition.recoveryScore}/100.
- Quote the exact calorie and macro numbers provided — never invent your own nutrition numbers: ${nutrition.calorieTarget} kcal, ${nutrition.proteinG}g protein, ${nutrition.carbsG}g carbs, ${nutrition.fatG}g fat.
- Respect any injuries/limitations: ${answers.injuries}.
Respond with ONLY valid JSON matching this shape, no prose, no markdown fences:
{
  "programName": string, "tagline": string, "overview": string, "weeklyVolume": string,
  "progressionStrategy": string, "nutritionTips": string[], "recoveryAdvice": string[],
  "warmup": string[], "cooldown": string[],
  "days": [{ "day": number, "name": string, "focus": string, "duration": string,
    "exercises": [{ "name": string, "sets": number, "reps": string, "rest": string, "notes": string }] }]
}`

    const userPrompt = `Full client profile: ${JSON.stringify(answers)}\nCalculated nutrition: ${JSON.stringify(nutrition)}\nBuild a ${answers.trainingDays}-day/week program focused on: ${answers.goal}.`

    const programData = await callLLM(systemPrompt, userPrompt)

    return new Response(JSON.stringify(programData), {
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    })
  }
})
