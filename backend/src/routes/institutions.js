const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');

// Institution endpoints (Super Admin & College Hub)
router.get('/', institutionController.getInstitutions);
router.get('/:id', institutionController.getInstitutionById);
router.post('/', institutionController.createInstitution);
router.put('/:id', institutionController.updateInstitution);
router.delete('/:id', institutionController.deleteInstitution);

module.exports = router;
