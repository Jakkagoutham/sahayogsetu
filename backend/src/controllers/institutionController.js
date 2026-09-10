const db = require('../db');

// GET /api/institutions
function getInstitutions(req, res) {
  try {
    const institutions = db.getInstitutions();
    return res.json({ success: true, count: institutions.length, institutions });
  } catch (err) {
    console.error("Error fetching institutions:", err);
    return res.status(500).json({ error: "Failed to fetch institutions." });
  }
}

// GET /api/institutions/:id
function getInstitutionById(req, res) {
  try {
    const { id } = req.params;
    const inst = db.getInstitutionById(id);
    if (!inst) {
      return res.status(404).json({ error: "Institution profile not found." });
    }
    return res.json({ success: true, institution: inst });
  } catch (err) {
    console.error("Error fetching institution detail:", err);
    return res.status(500).json({ error: "Failed to fetch institution." });
  }
}

// POST /api/institutions
function createInstitution(req, res) {
  try {
    const { 
      name, 
      fullName, 
      hubCode, 
      state, 
      district, 
      aisheCode, 
      nodalOfficer, 
      nodalEmail, 
      nodalPhone, 
      domains, 
      activeTeams, 
      badge,
      avgScore,
      nationalRank 
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Institution name is required." });
    }

    const created = db.createInstitution({
      name: name.trim(),
      fullName: fullName ? fullName.trim() : name.trim(),
      hubCode,
      state: state || "National",
      district: district || "",
      aisheCode: aisheCode || "",
      nodalOfficer: nodalOfficer || "Designated Nodal Officer",
      nodalEmail: nodalEmail || "",
      nodalPhone: nodalPhone || "",
      domains: domains || ["Engineering", "Civic Tech"],
      activeTeams: Number(activeTeams) || 5,
      badge: badge || "Registered Technical Hub",
      avgScore: Number(avgScore) || 88.0,
      nationalRank: Number(nationalRank) || 15
    });

    return res.status(201).json({
      success: true,
      message: "Institution profile successfully created.",
      institution: created
    });
  } catch (err) {
    console.error("Error creating institution profile:", err);
    return res.status(500).json({ error: "Failed to create institution profile." });
  }
}

// PUT /api/institutions/:id
function updateInstitution(req, res) {
  try {
    const { id } = req.params;
    const updated = db.updateInstitution(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Institution not found." });
    }
    return res.json({ success: true, institution: updated });
  } catch (err) {
    console.error("Error updating institution:", err);
    return res.status(500).json({ error: "Failed to update institution." });
  }
}

// DELETE /api/institutions/:id
function deleteInstitution(req, res) {
  try {
    const { id } = req.params;
    const removed = db.deleteInstitution(id);
    if (!removed) {
      return res.status(404).json({ error: "Institution not found." });
    }
    return res.json({ 
      success: true, 
      message: "Institution profile deleted successfully.", 
      id: removed.id, 
      name: removed.name 
    });
  } catch (err) {
    console.error("Error deleting institution:", err);
    return res.status(500).json({ error: "Failed to delete institution profile." });
  }
}

module.exports = {
  getInstitutions,
  getInstitutionById,
  createInstitution,
  updateInstitution,
  deleteInstitution
};
