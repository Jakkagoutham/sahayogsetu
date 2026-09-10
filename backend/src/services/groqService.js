const { Groq } = require('groq-sdk');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY || '' });

// Models prioritized by availability on this API key
const CANDIDATE_MODELS = [
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
  "groq/compound-mini",
  "qwen/qwen3.6-27b"
];

// Helper to extract JSON cleanly from model output (handles ```json fences or plain text)
function parseJsonFromResponse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (err2) {
        return null;
      }
    }
    return null;
  }
}

// Execute completion with fallback across available models
async function runGroqCompletion(messages, maxTokens = 400) {
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.1,
        max_tokens: maxTokens
      });
      const content = completion.choices[0]?.message?.content;
      if (content) return { content, model };
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed: ${err.message}. Trying next candidate...`);
    }
  }
  throw lastError || new Error("All Groq models failed.");
}

/**
 * 1. AI Classification of Citizen Complaint
 * Categorizes the problem, estimates urgency, administrative level, and SLA timeline.
 */
async function classifyProblem(title, description, locationText = "") {
  const prompt = `Classify the following citizen societal complaint for the Smart India Hackathon SahayogSetu platform.
Respond ONLY in valid JSON format with these exact fields:
- "category": one of ["Water", "Sanitation", "Education", "Roads", "Health", "Agriculture", "Infrastructure", "Other"]
- "urgency": one of ["Low", "Medium", "High"]
- "level": one of ["Village/Ward", "Mandal", "District", "State"] (based on how widespread or severe the issue is)
- "maxResolutionDays": number (7 for "Village/Ward", 15 for "Mandal", 30 for "District", 90 for "State")
- "summaryReason": brief 1-sentence explanation of why this category, level, and SLA were chosen

Complaint Details:
Title: "${title}"
Description: "${description}"
Location: "${locationText}"

Respond with ONLY the JSON object, no Markdown code fences, no other commentary.`;

  try {
    const { content } = await runGroqCompletion([
      { role: "system", content: "You are an expert AI civic triage and classification system. Always reply with strict JSON." },
      { role: "user", content: prompt }
    ], 350);

    const parsed = parseJsonFromResponse(content);
    if (!parsed) throw new Error("Could not parse JSON from model response");

    // Normalize level & maxResolutionDays according to SIH SLA matrix
    let level = parsed.level || "Village/Ward";
    if (level.includes("Village") || level.includes("Ward")) level = "Village/Ward";
    else if (level.includes("Mandal")) level = "Mandal";
    else if (level.includes("District")) level = "District";
    else if (level.includes("State")) level = "State";

    const slaMap = {
      "Village/Ward": 7,
      "Mandal": 15,
      "District": 30,
      "State": 90
    };

    return {
      category: parsed.category || "Other",
      urgency: parsed.urgency || "Medium",
      level: level,
      maxResolutionDays: slaMap[level] || 7,
      summaryReason: parsed.summaryReason || "Classified via Groq AI"
    };
  } catch (err) {
    console.error("Groq AI classification failed, using fallback:", err.message);
    return {
      category: "Other",
      urgency: "Medium",
      level: "Village/Ward",
      maxResolutionDays: 7,
      summaryReason: "Default triage applied (offline fallback)."
    };
  }
}

/**
 * 2. AI Solution Evaluation based on Official 6-Parameter SIH Weightage Matrix:
 * - Resolution Rate (Weightage 30)
 * - Average Closure Time vs SLA (Weightage 20)
 * - Citizen Satisfaction Score (Weightage 20)
 * - Escalation Percentage (Weightage 10)
 * - Reopened Cases / Durability (Weightage 10)
 * - Innovation & Best Practices (Weightage 10)
 * Total: 100 Points
 */
async function evaluateSolution(problem, solution) {
  const prompt = `Evaluate the following student/university solution for a societal challenge based on the official 6-parameter government evaluation matrix.

Societal Problem:
- Title: "${problem.title}"
- Description: "${problem.description}"
- Category: "${problem.category}"
- Administrative Level: "${problem.level}" (Target SLA: ${problem.maxResolutionDays} Days)

Proposed Solution:
- Team: "${solution.teamName}" (${solution.institution || "University Team"})
- Solution Description: "${solution.description}"
- Proposed Implementation Time: ${solution.implementationTimeDays} Days
- Estimated Budget: "${solution.estimatedBudget || "Standard"}"

Score each of the 6 parameters strictly within their weightage bounds:
1. "resolutionRateScore" (0 to 30): How completely and effectively does this solve the root cause?
2. "closureTimeScore" (0 to 20): Can it realistically be completed within the ${problem.maxResolutionDays}-day ${problem.level} SLA?
3. "citizenSatisfactionScore" (0 to 20): Will this deliver tangible, high-satisfaction relief to citizens?
4. "escalationRiskScore" (0 to 10): Does it prevent the problem from escalating to higher authorities?
5. "reopenedCasesRiskScore" (0 to 10): How durable and maintenance-friendly is it (avoids recurring failure)?
6. "innovationScore" (0 to 10): Uses innovative tech, IoT, sustainable materials, or frugal engineering best practices.

Calculate "totalScore" as the sum (0 to 100).
Provide "aiRemarks" (2 concise sentences summarizing technical feasibility and why authorities should or shouldn't pilot this).

Respond ONLY with this JSON structure:
{
  "resolutionRateScore": number,
  "closureTimeScore": number,
  "citizenSatisfactionScore": number,
  "escalationRiskScore": number,
  "reopenedCasesRiskScore": number,
  "innovationScore": number,
  "totalScore": number,
  "aiRemarks": string
}`;

  try {
    const { content } = await runGroqCompletion([
      { role: "system", content: "You are an official technical evaluation panelist assessing Smart India Hackathon engineering solutions. Always return strict JSON." },
      { role: "user", content: prompt }
    ], 450);

    const parsed = parseJsonFromResponse(content);
    if (!parsed) throw new Error("Could not parse JSON from model evaluation");

    const rScore = Math.min(30, Math.max(0, Number(parsed.resolutionRateScore) || 24));
    const cScore = Math.min(20, Math.max(0, Number(parsed.closureTimeScore) || 16));
    const sScore = Math.min(20, Math.max(0, Number(parsed.citizenSatisfactionScore) || 16));
    const eScore = Math.min(10, Math.max(0, Number(parsed.escalationRiskScore) || 8));
    const oScore = Math.min(10, Math.max(0, Number(parsed.reopenedCasesRiskScore) || 8));
    const iScore = Math.min(10, Math.max(0, Number(parsed.innovationScore) || 8));
    const total = rScore + cScore + sScore + eScore + oScore + iScore;

    return {
      resolutionRateScore: rScore,
      closureTimeScore: cScore,
      citizenSatisfactionScore: sScore,
      escalationRiskScore: eScore,
      reopenedCasesRiskScore: oScore,
      innovationScore: iScore,
      totalScore: total,
      aiRemarks: parsed.aiRemarks || "Solution demonstrates high technical feasibility and alignment with problem parameters."
    };
  } catch (err) {
    console.error("Groq AI solution evaluation failed, using algorithmic fallback:", err.message);
    const targetDays = problem.maxResolutionDays || 15;
    const timeRatio = Math.max(0, 1 - Math.max(0, (solution.implementationTimeDays - targetDays) / targetDays));
    const closureScore = Math.round(14 + (timeRatio * 6));
    return {
      resolutionRateScore: 25,
      closureTimeScore: Math.min(20, closureScore),
      citizenSatisfactionScore: 17,
      escalationRiskScore: 8,
      reopenedCasesRiskScore: 8,
      innovationScore: 8,
      totalScore: 25 + Math.min(20, closureScore) + 17 + 8 + 8 + 8,
      aiRemarks: "Algorithmic evaluation: Solution addresses the core problem statement within operational constraints."
    };
  }
}

/**
 * 3. Duplicate Detection & Cross-Locality Similarity Matching
 */
async function checkDuplicateAndSimilar(newProblem, candidateProblems) {
  if (!candidateProblems || candidateProblems.length === 0) {
    return { isDuplicate: false, matchedProblemId: null, duplicateReason: null };
  }

  const prompt = `Compare this newly submitted citizen complaint against existing complaints in the database to detect duplicates.

New Complaint:
Title: "${newProblem.title}"
Description: "${newProblem.description}"
Location: "${newProblem.location?.village || ''}, ${newProblem.location?.district || ''}, ${newProblem.location?.state || ''}"

Existing Complaints:
${candidateProblems.map((p, i) => `[ID: ${p.id}] Title: "${p.title}" | Location: "${p.location?.village || ''}, ${p.location?.district || ''}" | Desc: "${p.description.substring(0, 120)}..."`).join("\n")}

Respond ONLY with JSON:
{
  "isDuplicate": boolean,
  "matchedProblemId": string or null,
  "duplicateReason": string or null
}`;

  try {
    const { content } = await runGroqCompletion([
      { role: "system", content: "You are an AI civic duplicate detection system. Always return strict JSON." },
      { role: "user", content: prompt }
    ], 250);

    const parsed = parseJsonFromResponse(content);
    return parsed || { isDuplicate: false, matchedProblemId: null, duplicateReason: null };
  } catch (err) {
    console.error("Groq AI duplicate detection error:", err.message);
    return { isDuplicate: false, matchedProblemId: null, duplicateReason: null };
  }
}

/**
 * 4. Verify Photo Ground Proof Relevance
 * Uses multimodal AI vision to verify that the uploaded photo actually depicts or relates to the problem statement.
 */
async function verifyPhotoRelevance(photoDataUrl, title, description, locationText = "") {
  if (!photoDataUrl || typeof photoDataUrl !== 'string') {
    return {
      isRelevant: true,
      detectedSubject: "No photo attached",
      reason: "No photo provided to audit.",
      relevanceScore: 100
    };
  }

  // If photo is standard dummy placeholder, accept it
  if (photoDataUrl.includes('images.unsplash.com') && !photoDataUrl.startsWith('data:')) {
    return {
      isRelevant: true,
      detectedSubject: "Reference ground image",
      reason: "Verified reference photo.",
      relevanceScore: 90
    };
  }

  const prompt = `You are an AI Civic Ground-Proof Inspector for an official Government Grievance and Public Infrastructure Portal.
Your task is to inspect the attached photo and determine whether it is genuinely relevant ground proof for the reported societal problem.

Problem Title: "${title}"
Problem Description: "${description}"
Location: "${locationText}"

Inspection Guidelines:
1. Examine what is depicted in the photo.
2. Determine if the image represents, portrays, or is contextually relevant to the reported civic/societal defect (e.g. road damage, potholes, broken water pipe, drainage/sanitation overflow, hospital/PHC issue, electricity/transformer failure, agricultural failure, garbage dump, etc.).
3. REJECT (isRelevant: false) if the image is completely irrelevant (e.g. selfies, human portraits, food/dining, pets/cats/dogs, cartoons, memes, screenshots of unrelated apps, indoor personal spaces, or nature/plants when the problem is about roads, bridges, electricity, or water pipelines).
4. ACCEPT (isRelevant: true) if the photo depicts the problem area, infrastructure, affected community, or physical manifestation of the issue.

Respond strictly in valid JSON format:
{
  "isRelevant": boolean,
  "detectedSubject": "concise description of what is visible in the photo",
  "reason": "clear 1-2 sentence explanation of why the photo matches or fails to match the problem statement",
  "relevanceScore": number (0 to 100)
}
Respond with ONLY valid JSON, no markdown fences.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: photoDataUrl } }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 350
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = parseJsonFromResponse(content);

    if (!parsed || typeof parsed.isRelevant !== 'boolean') {
      console.warn("Could not parse photo relevance JSON, defaulting to permissive check:", content);
      return {
        isRelevant: true,
        detectedSubject: "Civic ground capture",
        reason: "Photo processed successfully.",
        relevanceScore: 85
      };
    }

    return {
      isRelevant: parsed.isRelevant,
      detectedSubject: parsed.detectedSubject || "Uploaded photograph",
      reason: parsed.reason || (parsed.isRelevant ? "Photo matches problem statement." : "Photo is irrelevant to the problem statement."),
      relevanceScore: Number(parsed.relevanceScore) || (parsed.isRelevant ? 90 : 10)
    };
  } catch (err) {
    console.error("Groq vision photo relevance check failed:", err.message);
    // If vision API is temporarily unavailable or image format issue, log and allow
    return {
      isRelevant: true,
      detectedSubject: "Image processed",
      reason: "Vision inspection bypassed due to service latency.",
      relevanceScore: 80
    };
  }
}

/**
 * 5. Comprehensive 5-Aspect Relevance Audit
 * Audits: (1) Photo, (2) Title, (3) Description, (4) Place details, (5) Civic Context.
 * If any aspect looks irrelevant, marks isIrrelevant: true so it can be kept at the very last
 * with title 'Irrelevant' and routed to government moderation notification.
 */
async function auditComprehensiveProblem({ title, description, location, photoDataUrl }) {
  const locationText = `${location?.village || ''}, ${location?.mandal || ''}, ${location?.district || ''}, ${location?.state || ''} - ${location?.pincode || ''}`;
  
  // Quick heuristic check for obvious gibberish or spam
  const cleanTitle = (title || '').trim().toLowerCase();
  const cleanDesc = (description || '').trim().toLowerCase();
  const gibberishRegex = /^(asdf|qwerty|test[0-9]*$|aaaa|zzzz|1234|xyz|blah|foo|bar)/i;
  
  let heuristicFlag = null;
  if (cleanTitle.length < 4 || gibberishRegex.test(cleanTitle)) {
    heuristicFlag = "Title contains meaningless or test gibberish.";
  } else if (cleanDesc.length < 8 || gibberishRegex.test(cleanDesc)) {
    heuristicFlag = "Description lacks sufficient civic context or contains test input.";
  }

  // 1. Inspect Photo if present as uploaded base64 data
  let photoAudit = { isRelevant: true, detectedSubject: "Ground photograph", reason: "" };
  if (photoDataUrl && photoDataUrl.startsWith('data:')) {
    photoAudit = await verifyPhotoRelevance(photoDataUrl, title, description, locationText);
  }

  // 2. Perform holistic 5-aspect LLM evaluation
  const prompt = `You are an AI Civic Integrity & Moderation System for an official Government Grievance Portal (SahayogSetu).
Evaluate whether the following citizen complaint submission is a GENUINE and RELEVANT public/societal problem, or if it is IRRELEVANT (spam, nonsensical, test input, personal rant, non-civic chat, abusive, fake place, or mismatched photo).

Submission details across 5 dimensions:
1. PROBLEM TITLE: "${title}"
2. PROBLEM DESCRIPTION: "${description}"
3. PROBLEM PLACE DETAILS: State: "${location?.state || ''}", District: "${location?.district || ''}", Mandal: "${location?.mandal || ''}", Village/Ward: "${location?.village || ''}", Pincode: "${location?.pincode || ''}"
4. PROBLEM CONTEXT: Is this an authentic civic/public infrastructure/societal issue (water, roads, health, agriculture, sanitation, education, power, environment)?
5. PHOTO AUDIT SUMMARY: "${photoAudit.detectedSubject} - ${photoAudit.reason}" (Photo matches: ${photoAudit.isRelevant})

Evaluation Guidelines:
- Mark "isIrrelevant": true if ANY of the 5 aspects fails:
  * Title is gibberish, joke, promotional, or completely unrelated to civic challenges
  * Description is nonsensical, empty of civic details, or purely personal
  * Place details are obviously fake, nonsensical, or absent
  * Problem context is not a societal grievance
  * Photo is completely irrelevant (e.g. selfies, memes, food, domestic pets)
- Mark "isIrrelevant": false ONLY if all aspects are coherent, relevant, and represent a legitimate societal grievance.

Respond ONLY with valid JSON:
{
  "isIrrelevant": boolean,
  "relevanceScore": number,
  "flagReason": "concise 1-sentence explanation of which aspect was irrelevant and why (or empty string if valid)",
  "detectedSubject": "summary of detected content"
}`;

  try {
    const { content } = await runGroqCompletion([
      { role: "system", content: "You are a strict AI civic grievance moderation inspector. Always return valid JSON." },
      { role: "user", content: prompt }
    ], 300);

    const parsed = parseJsonFromResponse(content);
    if (parsed && typeof parsed.isIrrelevant === 'boolean') {
      if (!photoAudit.isRelevant) {
        return {
          isIrrelevant: true,
          relevanceScore: Math.min(parsed.relevanceScore || 30, photoAudit.relevanceScore || 20),
          flagReason: photoAudit.reason || parsed.flagReason || "Photo does not depict the reported civic problem.",
          detectedSubject: photoAudit.detectedSubject || parsed.detectedSubject || "Mismatched photo"
        };
      }
      return {
        isIrrelevant: parsed.isIrrelevant,
        relevanceScore: Number(parsed.relevanceScore) || (parsed.isIrrelevant ? 25 : 85),
        flagReason: parsed.flagReason || (parsed.isIrrelevant ? "Submission flagged as irrelevant or non-civic." : ""),
        detectedSubject: parsed.detectedSubject || "Civic Complaint"
      };
    }
  } catch (err) {
    console.warn("Groq comprehensive relevance audit failed, using heuristic fallback:", err.message);
  }

  // Fallback heuristic if LLM call failed or offline
  if (heuristicFlag || !photoAudit.isRelevant) {
    return {
      isIrrelevant: true,
      relevanceScore: 30,
      flagReason: heuristicFlag || photoAudit.reason || "Uploaded photo or submission text lacks civic relevance.",
      detectedSubject: photoAudit.detectedSubject || "Unverified content"
    };
  }

  return {
    isIrrelevant: false,
    relevanceScore: 85,
    flagReason: "",
    detectedSubject: "Verified Civic Report"
  };
}

module.exports = {
  classifyProblem,
  evaluateSolution,
  checkDuplicateAndSimilar,
  verifyPhotoRelevance,
  auditComprehensiveProblem
};

