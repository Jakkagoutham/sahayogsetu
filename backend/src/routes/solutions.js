const express = require('express');
const router = express.Router();
const solutionController = require('../controllers/solutionController');

// Mentor mobile verification OTP endpoints
router.post('/send-mentor-otp', solutionController.sendMentorOtp);
router.post('/verify-mentor-otp', solutionController.verifyMentorOtp);

// Upvote solution
router.post('/:id/upvote', solutionController.upvoteSolution);

module.exports = router;
