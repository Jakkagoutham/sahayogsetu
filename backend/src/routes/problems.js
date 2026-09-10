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
router.get('/:id', problemController.getProblemById);

// Submitting solutions to a problem
router.post('/:id/solutions', solutionController.createSolution);

// Uploading resolution proof and marking problem as Solved
router.post('/:id/resolve', upload.single('resolutionPhoto'), problemController.resolveProblem);

// Update status / grant pilot sanction
router.patch('/:id/status', problemController.updateProblemStatus);

module.exports = router;

