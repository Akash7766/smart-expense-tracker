const express = require('express');
const router = express.Router();
const { generateInsights } = require('../controllers/insight.controller');
const { requireAuth } = require('../middleware/requireAuth');

router.use(requireAuth);

router.post('/', generateInsights);

module.exports = router;
