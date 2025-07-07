"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mock_1 = require("../ai/mock");
const router = (0, express_1.Router)();
const aiService = new mock_1.MockAIService();
router.post('/analyze', async (req, res) => {
    try {
        const { conversationHistory, secretWord, gameContext } = req.body;
        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return res.status(400).json({
                success: false,
                error: 'conversationHistory is required and must be an array'
            });
        }
        const aiResponse = await aiService.analyzeConversation(conversationHistory, secretWord, gameContext);
        return res.json({
            success: true,
            data: aiResponse
        });
    }
    catch (error) {
        console.error('Error in AI analyze endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/thinking', async (req, res) => {
    try {
        const { conversationHistory, gameContext } = req.body;
        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return res.status(400).json({
                success: false,
                error: 'conversationHistory is required and must be an array'
            });
        }
        const thinking = await aiService.generateThinkingProcess(conversationHistory, gameContext);
        return res.json({
            success: true,
            data: { thinking }
        });
    }
    catch (error) {
        console.error('Error in AI thinking endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/guess', async (req, res) => {
    try {
        const { conversationHistory, availableWords, gameContext } = req.body;
        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return res.status(400).json({
                success: false,
                error: 'conversationHistory is required and must be an array'
            });
        }
        if (!availableWords || !Array.isArray(availableWords)) {
            return res.status(400).json({
                success: false,
                error: 'availableWords is required and must be an array'
            });
        }
        const guess = await aiService.generateGuess(conversationHistory, availableWords, gameContext);
        return res.json({
            success: true,
            data: guess
        });
    }
    catch (error) {
        console.error('Error in AI guess endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const health = await aiService.getHealth();
        return res.json({
            success: true,
            data: health
        });
    }
    catch (error) {
        console.error('Error in AI health endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map