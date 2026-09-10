const db = require('../db');
const groqService = require('../services/groqService');
const smsService = require('../services/smsService');

// In-memory OTP storage for mentor verification (Phone -> { otp, expiresAt, mentorName })
const mentorOtpStore = new Map();

// Helper to normalize phone number to standard 10-digit Indian mobile
function cleanPhone(phone) {
  return smsService.clean10DigitPhone(phone);
}

// POST /api/solutions/send-mentor-otp
async function sendMentorOtp(req, res) {
  try {
    const { phone, mentorName } = req.body;
    const normalizedPhone = cleanPhone(phone);

    if (!normalizedPhone || normalizedPhone.length !== 10) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)." });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    // Invalidate any previous OTP and save the new one
    mentorOtpStore.set(normalizedPhone, {
      otp,
      expiresAt,
      mentorName: (mentorName || 'Faculty Mentor').trim(),
      phone: normalizedPhone,
      createdAt: Date.now()
    });

    // Dispatch real SMS to the mentor's mobile number (if carrier gateway is configured)
    const dispatchResult = await smsService.sendSmsOtp(normalizedPhone, otp, mentorName);

    const masked = smsService.maskPhone(normalizedPhone);
    const hasCarrier = smsService.hasCarrierGatewayConfigured();
    const whatsappUrl = smsService.getWhatsAppDispatchUrl(normalizedPhone, otp, mentorName);
    const smsAppUrl = smsService.getSmsAppUrl(normalizedPhone, otp, mentorName);

    return res.json({
      success: true,
      message: hasCarrier
        ? `Carrier SMS dispatched to mentor's mobile (${masked}). Please enter the 6-digit OTP received on the phone.`
        : `Verification code generated for mentor (${masked}). Click below to deliver it directly to the phone via WhatsApp or SMS.`,
      maskedPhone: masked,
      phone: normalizedPhone,
      hasCarrier,
      whatsappUrl,
      smsAppUrl,
      provider: dispatchResult.provider,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("Error sending mentor OTP:", err);
    return res.status(500).json({ error: "Failed to dispatch mentor OTP." });
  }
}

// POST /api/solutions/verify-mentor-otp
function verifyMentorOtp(req, res) {
  try {
    const { phone, otp } = req.body;
    const normalizedPhone = cleanPhone(phone);

    if (!normalizedPhone || !otp) {
      return res.status(400).json({ error: "Mobile number and 6-digit OTP code are required." });
    }

    const record = mentorOtpStore.get(normalizedPhone);
    if (!record) {
      return res.status(400).json({ error: `No active OTP request found for mobile ${normalizedPhone}. Please click 'Send Verification OTP' first.` });
    }

    if (Date.now() > record.expiresAt) {
      mentorOtpStore.delete(normalizedPhone);
      return res.status(400).json({ error: "Verification OTP has expired (15-minute limit). Please click 'Resend Code'." });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Incorrect verification OTP. Please recheck the 6-digit code received on the mobile phone." });
    }

    // Mark verified and clear OTP
    mentorOtpStore.delete(normalizedPhone);

    return res.json({
      success: true,
      verified: true,
      message: `Faculty Mentor (${record.mentorName}) successfully verified via secure OTP.`
    });
  } catch (err) {
    console.error("Error verifying mentor OTP:", err);
    return res.status(500).json({ error: "Failed to verify mentor OTP." });
  }
}

// POST /api/problems/:id/solutions
async function createSolution(req, res) {
  try {
    const problemId = req.params.id;
    const {
      teamName,
      institution,
      contactLead,
      contactEmail,
      contactPhone,
      description,
      implementationTimeDays,
      estimatedBudget,
      prototypeUrl,
      mentorStatus,
      mentorDetails,
      industryPartner
    } = req.body;

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ error: "Team / Innovator name is required." });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Detailed solution proposal is required." });
    }

    const problem = db.getProblemById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Target problem not found." });
    }

    // 1. Evaluate with Groq AI using Official SIH 6-Parameter Weightage Matrix
    const aiEvaluation = await groqService.evaluateSolution(problem, {
      teamName,
      institution,
      description,
      implementationTimeDays: Number(implementationTimeDays) || 7,
      estimatedBudget
    });

    // 2. Determine official Mentor Status
    let computedMentorStatus = mentorStatus;
    if (!computedMentorStatus) {
      computedMentorStatus = mentorDetails?.isOtpVerified ? "Mentor Approved" : "Pending Mentor Review";
    }

    // 3. Persist Solution with Team Details & AI Score Breakdown
    const solution = db.createSolution({
      problemId,
      teamName: teamName.trim(),
      institution: institution?.trim() || "Independent University Team",
      contactLead: contactLead?.trim() || "Lead Contact",
      contactEmail: contactEmail?.trim() || "team@university.edu",
      contactPhone: contactPhone?.trim() || "+91 90000 00000",
      description: description.trim(),
      implementationTimeDays: Number(implementationTimeDays) || 7,
      estimatedBudget: estimatedBudget?.trim() || "Standard SIH Prototype",
      prototypeUrl: prototypeUrl?.trim() || "",
      mentorStatus: computedMentorStatus,
      mentorDetails: mentorDetails || null,
      industryPartner: industryPartner?.trim() || null,
      aiEvaluation
    });

    return res.status(201).json({
      success: true,
      solution
    });
  } catch (err) {
    console.error("Error creating solution:", err);
    return res.status(500).json({ error: "Failed to submit solution." });
  }
}

// POST /api/solutions/:id/upvote
function upvoteSolution(req, res) {
  try {
    const { id } = req.params;
    const updated = db.upvoteSolution(id);
    if (!updated) {
      return res.status(404).json({ error: "Solution not found." });
    }
    return res.json({ success: true, solution: updated, votes: updated.votes });
  } catch (err) {
    console.error("Error upvoting solution:", err);
    return res.status(500).json({ error: "Failed to register upvote." });
  }
}

module.exports = {
  createSolution,
  upvoteSolution,
  sendMentorOtp,
  verifyMentorOtp
};
