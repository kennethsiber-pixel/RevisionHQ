export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const body = req.body || {};
  const answer = String(body.answer || '').trim();
  const question = String(body.question || '').trim();
  const topic = String(body.topic || '').trim();
  const subject = String(body.subject || '').trim();
  const unit = String(body.unit || '').trim();
  const mode = String(body.mode || '').trim();
  const anchors = Array.isArray(body.anchors) ? body.anchors.slice(0, 6).map(String) : [];

  if (!question || !answer) return res.status(400).json({ error: 'Missing question or answer' });
  if (answer.length > 6000) return res.status(400).json({ error: 'Answer too long' });

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    return res.status(503).json({
      error: 'AI assessment is not configured on this deployment.',
      code: 'NO_AI_AUTH'
    });
  }

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      meaningfulAttempt: { type: 'boolean' },
      score: { type: 'integer', minimum: 0, maximum: 100 },
      verdict: { type: 'string' },
      feedback: { type: 'string' },
      strengths: { type: 'array', items: { type: 'string' }, maxItems: 3 },
      corrections: { type: 'array', items: { type: 'string' }, maxItems: 3 },
      missing: { type: 'array', items: { type: 'string' }, maxItems: 3 },
      nextAction: { type: 'string' }
    },
    required: ['meaningfulAttempt','score','verdict','feedback','strengths','corrections','missing','nextAction']
  };

  const system = `You are Revision HQ's A-level revision coach for a 17-year-old student.
Assess the student's actual answer, not keyword matches.
Be encouraging but academically honest. This is formative feedback, not punishment.
A genuine attempt should almost never be rejected: even if wrong or very short, score it and explain what is useful, inaccurate, or missing.
Set meaningfulAttempt=false ONLY for blank text, obvious keyboard mash, repeated nonsense, or content with no plausible attempt to answer the question.
Judge factual accuracy, relevance, explanation, use of evidence/terminology, and (where appropriate) evaluation/judgement.
Adapt expectations to the mode: a 5-minute 'Just Start' answer may be brief and rough; 8-minute is concise recall; 15-minute expects developed explanation; 25-minute expects exam-ready structure/evaluation.
Do not demand exact wording from the reference anchors. Accept correct paraphrases and other valid relevant knowledge.
If the answer contains a factual error, identify it specifically in corrections.
Feedback should sound like a smart tutor speaking directly to the student: specific, concise, useful, not patronising.
Score meaning:
0-19 = no usable answer / fundamentally off-topic
20-39 = relevant fragments but major gaps/errors
40-59 = partial knowledge, some correct explanation
60-74 = solid answer with clear relevant knowledge
75-89 = strong, accurate, developed answer
90-100 = excellent for the requested mode
Keep feedback under about 90 words total across all text fields.`;

  const payload = {
    subject, unit, topic, mode, question, answer,
    referenceAnchors: anchors
  };

  try {
    const ai = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.6-sol',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify(payload) }
        ],
        stream: false,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'revision_answer_assessment',
            strict: true,
            schema
          }
        }
      })
    });

    const raw = await ai.text();
    if (!ai.ok) {
      console.error('AI Gateway error', ai.status, raw.slice(0, 1000));
      return res.status(502).json({ error: 'AI assessment temporarily unavailable.', code: 'AI_GATEWAY_ERROR' });
    }

    let outer;
    try { outer = JSON.parse(raw); } catch {
      return res.status(502).json({ error: 'AI returned an unreadable response.', code: 'BAD_AI_RESPONSE' });
    }

    const content = outer?.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'AI returned no assessment.', code: 'EMPTY_AI_RESPONSE' });

    let assessment;
    try { assessment = typeof content === 'string' ? JSON.parse(content) : content; } catch {
      return res.status(502).json({ error: 'AI assessment could not be parsed.', code: 'BAD_AI_JSON' });
    }

    return res.status(200).json({ ...assessment, source: 'ai' });
  } catch (err) {
    console.error('Assessment exception', err);
    return res.status(500).json({ error: 'AI assessment failed.', code: 'ASSESSMENT_EXCEPTION' });
  }
}
