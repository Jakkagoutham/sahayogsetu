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

    // 2. Photo Relevance Ground-Truth Inspection
    // When a photo is uploaded, verify via AI Vision if it matches the complaint
    if (req.file || (photoUrl && photoUrl.startsWith('data:'))) {
      const relevanceAudit = await groqService.verifyPhotoRelevance(finalPhotoUrl, title, description, locationText);
      if (!relevanceAudit.isRelevant) {
        return res.status(422).json({
          success: false,
          error: "Photo Relevance Mismatch",
          message: "The uploaded photo is not relevant to the problem statement. Government grievance records require authentic ground proof.",
          detectedSubject: relevanceAudit.detectedSubject,
          reason: relevanceAudit.reason,
          relevanceScore: relevanceAudit.relevanceScore
        });
      }
    }

    // 3. Call Groq AI for Automatic Triage & SLA Assignment
    const aiClassification = await groqService.classifyProblem(title, description, locationText);

    // 4. Duplicate Detection Check
    const { localMatches, crossStateMatches } = db.findSimilarCandidates(
      aiClassification.category, 
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
      category: aiClassification.category,
      urgency: aiClassification.urgency,
      level: aiClassification.level,
      maxResolutionDays: aiClassification.maxResolutionDays,
      duplicateOf: duplicateCheck.isDuplicate ? duplicateCheck.matchedProblemId : null
    });

    return res.status(201).json({
      success: true,
      problem: created,
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

module.exports = {
  createProblem,
  getProblems,
  getProblemById,
  resolveProblem,
  updateProblemStatus
};

