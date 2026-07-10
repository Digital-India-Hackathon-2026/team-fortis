import { Router } from 'express';
import { AiController } from '../controllers/ai.controller.js';

const router = Router();

router.post('/analyze-image', AiController.analyzeImage);
router.post('/voice-assistant', AiController.voiceAssistant);

export default router;
