const express = require('express');
const router = express.Router();
const multer = require('multer');
const problemController = require('../controllers/problemController');
const solutionController = require('../controllers/solutionController');

// In-memory upload for EXIF parsing and base64 conversion (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Problem endpoints
router.get('/', problemController.getProblems);
router.post('/', upload.single('photo'), problemController.createProblem);

// Voice-based grievance intake & AI auto-fill
router.post('/voice-intake', upload.single('audio'), problemController.processVoiceIntake);

router.get('/:id', problemController.getProblemById);

// Submitting solutions to a problem
router.post('/:id/solutions', solutionController.createSolution);

// Uploading resolution proof and marking problem as Solved
router.post('/:id/resolve', upload.single('resolutionPhoto'), problemController.resolveProblem);

// Update status / grant pilot sanction
router.patch('/:id/status', problemController.updateProblemStatus);

// Grama / Ward Sachivalayam e-dispatch
router.patch('/:id/sachivalayam-dispatch', problemController.dispatchToSachivalayam);

// Delete single problem (Authority moderation)
router.delete('/:id', problemController.deleteProblem);

// Batch delete problems (Authority moderation)
router.post('/batch-delete', problemController.batchDeleteProblems);

module.exports = router;

