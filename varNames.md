# Variable Renaming Checklist

## Renaming Rules:
- encryptor/Encryptor/outsider/Outsider → encoder/Encoder
- decryptor/Decryptor/insider/Insider → decoder/Decoder

## Files to Process:

### Backend Files:
- [ ] backend/ai-api-docs.md
- [x] backend/bugs/ai-not-triggering-after-decoder-guess.txt
- [x] backend/mobile-integration.md
- [ ] backend/openai/index.ts
- [ ] backend/openai/routes/ai.ts
- [ ] backend/openai/services/openai.ts
- [ ] backend/openai/services/promptTests.ts
- [ ] backend/openai/test-openai.ts
- [x] backend/openai/types/game.ts
- [x] backend/server-spec.md
- [x] backend/src/ai/mock.ts
- [x] backend/src/game/index.ts
- [x] backend/src/game/logic.ts
- [x] backend/src/game/state.ts
- [x] backend/src/game/wordManager.ts
- [x] backend/src/rooms/manager.ts
- [x] backend/src/routes/ai.ts
- [x] backend/src/routes/rooms.ts
- [x] backend/src/server.ts
- [x] backend/src/socket/handlers/gameHandlers.ts
- [x] backend/src/socket/handlers/lobbyHandlers.ts
- [x] backend/src/socket/handlers/roomHandlers.ts
- [x] backend/src/types/index.ts
- [x] backend/src/utils/helpers.ts
- [x] backend/tests/aiRoutes.test.ts
- [x] backend/tests/aiService.test.ts
- [x] backend/tests/envConfig.test.ts
- [x] backend/tests/errorHandling.test.ts
- [x] backend/tests/gameLogicValidation.test.ts
- [x] backend/tests/gameStatePersistence.test.ts
- [x] backend/tests/integration.test.ts
- [x] backend/tests/lobbyHandlers.test.ts
- [x] backend/tests/lobbyIntegration.test.ts
- [x] backend/tests/performance.test.ts
- [ ] backend/tests/roomManager.test.ts
- [ ] backend/tests/roomManagerCreateRoom.test.ts
- [ ] backend/tests/roomsEndpoint.test.ts
- [ ] backend/tests/server.test.ts
- [ ] backend/tests/setup.ts
- [x] backend/tests/socketEvents.test.ts
- [x] backend/tests/turnValidation.test.ts
- [ ] backend/tests/validation.test.ts
- [ ] backend/tests/wordManager.test.ts

### Frontend Files:
- [x] frontend/app/_layout.tsx
- [ ] frontend/app/components/AIGuessSection.tsx
- [x] frontend/app/components/AISectionComponent.tsx
- [ ] frontend/app/components/AIThinkingSection.tsx
- [ ] frontend/app/components/ConnectionErrorScreen.tsx
- [ ] frontend/app/components/ConnectionStatusIndicator.tsx
- [ ] frontend/app/components/ConnectionTroubleshootingGuide.tsx
- [ ] frontend/app/components/ConversationHistory.tsx
- [ ] frontend/app/components/ConversationMessage.tsx
- [ ] frontend/app/components/GameStatusIndicator.tsx
- [ ] frontend/app/components/RoundModal.tsx
- [ ] frontend/app/components/ScoreProgressBar.tsx
- [ ] frontend/app/components/ScrollArea.tsx
- [x] frontend/app/decoder-game/index.tsx
- [x] frontend/app/encoder-game/index.tsx
- [ ] frontend/app/encoder-game/SecretWordContainer.tsx
- [ ] frontend/app/game-end/index.tsx
- [x] frontend/app/index.tsx
- [ ] frontend/app/lobby/index.tsx
- [ ] frontend/app/room/index.tsx
- [x] frontend/frontend-spec.md
- [x] frontend/services/websocket.ts
- [x] frontend/store/gameStore.ts
- [ ] frontend/test/conversationFiltering.test.ts
- [ ] frontend/test/lobbyUpdates.test.ts
- [ ] frontend/test/readyButton.test.ts
- [ ] frontend/test/websocketAIHandling.test.ts
- [ ] frontend/test/websocketRetryLogic.test.ts
- [ ] frontend/utils/stringValidation.ts

### Root Files:
- [x] IMPLEMENTATION_CHECKLIST.md
- [x] README.md
- [x] STORY.md

## Progress Notes:
- Started: 2025-01-15
- Current file: backend/src/types/index.ts ✅
- Issues found: 
  - Multiple documentation files still contain old terminology
  - Frontend game store and websocket service have extensive old naming
  - Game screen directories need renaming (encryptor-game → encoder-game, decryptor-game → decoder-game)
  - Root documentation files need updates
- Special considerations: 
  - Updated core type definitions for encoder/decoder roles
  - Need to rename directory structures for game screens
  - Documentation files require careful review to maintain context
- Completed:
  - ✅ Frontend game store (gameStore.ts)
  - ✅ Frontend websocket service (websocket.ts)
  - ✅ README.md
  - ✅ IMPLEMENTATION_CHECKLIST.md
  - ✅ Backend server-spec.md
  - ✅ Backend mobile-integration.md
  - ✅ Backend bug report
  - ✅ Frontend game screen files (encoder-game/index.tsx, decoder-game/index.tsx)
  - ✅ Frontend main index.tsx
  - ✅ Frontend AISectionComponent.tsx
  - ✅ Backend gameLogicValidation.test.ts
  - ✅ STORY.md
- Remaining Issues:
  - Frontend test files need updating (conversationFiltering.test.ts has many instances)
  - Some backend test files may need checking
  - Component files need verification
