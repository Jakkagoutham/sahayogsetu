const db = require('../db');
const groqService = require('../services/groqService');
const { verifyPhotoAndExtractGPS } = require('../services/photoVerificationService');

// POST /api/problems
async function createProblem(req, res) {
  try {
    const { 
      title, 
      description, 
      state, 
      district, 
      mandal, 
      village, 
      areaName, 
      pincode, 
      lat, 
      lng,
      photoUrl
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Problem title is required." });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Detailed problem description is required." });
    }

    // 1. Process Photo Proof & Verify GPS / Authenticity
    let declaredCoords = (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null;
    let fileBuffer = req.file ? req.file.buffer : null;
    
    const photoAudit = verifyPhotoAndExtractGPS(fileBuffer, declaredCoords);
    
    // Use uploaded file data URL if file exists, or passed photoUrl, or default
    let finalPhotoUrl = photoUrl;
    if (req.file) {
      const mime = req.file.mimetype || 'image/jpeg';
      finalPhotoUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
    } else if (!finalPhotoUrl) {
      finalPhotoUrl = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80";
    }

    const locationText = `${village || ''}, ${mandal || ''}, ${district || ''}, ${state || ''} - ${pincode || ''}`;

    // 2. Comprehensive 5-Aspect AI Audit (Photo, Title, Description, Place Details, Context)
    const relevanceAudit = await groqService.auditComprehensiveProblem({
      title,
      description,
      location: { state, district, mandal, village, pincode, areaName },
      photoDataUrl: finalPhotoUrl
    });

    let category = "Other";
    let urgency = "Medium";
    let level = "Village/Ward";
    let maxResolutionDays = 7;
    let isIrrelevant = false;
    let relevanceFlags = null;

    if (relevanceAudit.isIrrelevant) {
      isIrrelevant = true;
      category = "Irrelevant";
      urgency = "Low";
      level = "Village/Ward";
      maxResolutionDays = 90;
      relevanceFlags = {
        isIrrelevant: true,
        flagReason: relevanceAudit.flagReason,
        detectedSubject: relevanceAudit.detectedSubject,
        relevanceScore: relevanceAudit.relevanceScore
      };
    } else {
      // 3. Call Groq AI for Automatic Triage & SLA Assignment for valid complaints
      const aiClassification = await groqService.classifyProblem(title, description, locationText);
      category = aiClassification.category;
      urgency = aiClassification.urgency;
      level = aiClassification.level;
      maxResolutionDays = aiClassification.maxResolutionDays;
    }

    // 4. Duplicate Detection Check
    const { localMatches, crossStateMatches } = db.findSimilarCandidates(
      category, 
      village, 
      mandal, 
      district, 
      state
    );

    const duplicateCheck = await groqService.checkDuplicateAndSimilar({
      title,
      description,
      location: { village, district, state }
    }, localMatches.slice(0, 3));

    // 5. Save to Database (Zero citizen personal info!)
    const created = db.createProblem({
      title: title.trim(),
      description: description.trim(),
      photoUrl: finalPhotoUrl,
      photoAuthenticity: {
        isRealPhoto: photoAudit.isRealPhoto,
        confidence: photoAudit.confidence,
        hasGpsMeta: photoAudit.hasGpsMeta,
        detectionDetails: photoAudit.detectionDetails
      },
      location: {
        state: state || "National",
        district: district || "District Office",
        mandal: mandal || "Mandal",
        village: village || "Village Ward",
        areaName: areaName || "",
        pincode: pincode || "",
        coordinates: photoAudit.coordinates || { lat: 20.5937, lng: 78.9629 }
      },
      category,
      urgency,
      level,
      maxResolutionDays,
      isIrrelevant,
      relevanceFlags,
      duplicateOf: duplicateCheck.isDuplicate ? duplicateCheck.matchedProblemId : null
    });

    return res.status(201).json({
      success: true,
      problem: created,
      isIrrelevant: isIrrelevant,
      flagReason: relevanceFlags?.flagReason || null,
      duplicateDetected: duplicateCheck.isDuplicate,
      matchedDuplicateId: duplicateCheck.matchedProblemId,
      crossStateSimilarProblems: crossStateMatches
    });
  } catch (err) {
    console.error("Error creating problem:", err);
    return res.status(500).json({ error: "Internal server error creating problem." });
  }
}

// GET /api/problems
function getProblems(req, res) {
  try {
    const { category, level, urgency, state, search, status } = req.query;
    const problems = db.getProblems({ category, level, urgency, state, search, status });
    return res.json({ success: true, count: problems.length, problems });
  } catch (err) {
    console.error("Error fetching problems:", err);
    return res.status(500).json({ error: "Failed to fetch problems." });
  }
}

// GET /api/problems/:id
function getProblemById(req, res) {
  try {
    const { id } = req.params;
    const problem = db.getProblemById(id);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found." });
    }
    return res.json({ success: true, problem });
  } catch (err) {
    console.error("Error fetching problem detail:", err);
    return res.status(500).json({ error: "Failed to fetch problem detail." });
  }
}

// POST /api/problems/:id/resolve
async function resolveProblem(req, res) {
  try {
    const { id } = req.params;
    const { description, resolvedBy } = req.body;

    let finalPhotoUrl = req.body.photoUrl;
    if (req.file) {
      const mime = req.file.mimetype || 'image/jpeg';
      finalPhotoUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
    }

    if (!finalPhotoUrl) {
      return res.status(400).json({ 
        error: "Proof of resolution photo is required to officially mark this challenge as Solved." 
      });
    }

    const updated = db.resolveProblem(id, {
      photoUrl: finalPhotoUrl,
      description: description || "Civic issue successfully resolved on-site with photographic proof.",
      resolvedBy: resolvedBy || "Verified Implementation Team"
    });

    if (!updated) {
      return res.status(404).json({ error: "Problem not found." });
    }

    return res.json({
      success: true,
      message: "Civic challenge successfully marked as Solved with ground proof.",
      problem: updated
    });
  } catch (err) {
    console.error("Error resolving problem:", err);
    return res.status(500).json({ error: "Failed to resolve problem." });
  }
}

// PATCH /api/problems/:id/status
function updateProblemStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, pilotSanctioned, sanctionedGrant, remarks } = req.body;
    const updated = db.updateProblemStatus(id, { 
      status: status || "Pilot Sanctioned", 
      pilotSanctioned: pilotSanctioned !== undefined ? pilotSanctioned : true, 
      sanctionedGrant: sanctionedGrant || "₹ 1,00,000 SIH District Pilot Grant", 
      remarks 
    });
    if (!updated) {
      return res.status(404).json({ error: "Problem not found." });
    }
    return res.json({ success: true, problem: updated });
  } catch (err) {
    console.error("Error updating problem status:", err);
    return res.status(500).json({ error: "Failed to update problem status." });
  }
}

// DELETE /api/problems/:id
function deleteProblem(req, res) {
  try {
    const { id } = req.params;
    const removed = db.deleteProblem(id);
    if (!removed) {
      return res.status(404).json({ error: "Problem not found." });
    }
    return res.json({ 
      success: true, 
      message: "Problem successfully removed from the site.", 
      id: removed.id,
      title: removed.title
    });
  } catch (err) {
    console.error("Error deleting problem:", err);
    return res.status(500).json({ error: "Failed to delete problem." });
  }
}

// POST /api/problems/batch-delete
function batchDeleteProblems(req, res) {
  try {
    const ids = req.body.ids || req.body.problemIds;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "An array of problem IDs is required for batch deletion." });
    }
    const result = db.deleteProblems(ids);
    return res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} problems from the platform.`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error batch deleting problems:", err);
    return res.status(500).json({ error: "Failed to batch delete problems." });
  }
}

// POST /api/problems/voice-intake
async function processVoiceIntake(req, res) {
  try {
    const voiceService = require('../services/voiceService');
    const languageHint = req.body.language || req.query.language || '';
    
    // Case 1: Audio file upload via multipart/form-data
    if (req.file) {
      const result = await voiceService.processVoiceAudio(
        req.file.buffer,
        req.file.mimetype || 'audio/webm',
        languageHint
      );
      return res.json(result);
    }
    
    // Case 2: Base64 audio payload in JSON body
    if (req.body.audioBase64) {
      const base64Data = req.body.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(base64Data, 'base64');
      const mimeType = req.body.mimeType || 'audio/webm';
      const result = await voiceService.processVoiceAudio(audioBuffer, mimeType, languageHint);
      return res.json(result);
    }

    // Case 3: Raw spoken text (e.g. browser speech-to-text)
    if (req.body.spokenText) {
      const result = await voiceService.structureSpokenGrievance(req.body.spokenText);
      return res.json(result);
    }

    return res.status(400).json({
      error: "Audio recording file, audioBase64 string, or spokenText is required."
    });
  } catch (err) {
    console.error("Voice intake error:", err);
    return res.status(500).json({
      error: err.message || "Failed to process voice recording."
    });
  }
}

module.exports = {
  createProblem,
  getProblems,
  getProblemById,
  resolveProblem,
  updateProblemStatus,
  deleteProblem,
  batchDeleteProblems,
  processVoiceIntake
};

