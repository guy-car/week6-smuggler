# Issue: Backend Error on Decoder Guess Submission - RESOLVED ✅

## Problem
When the decoder (decryptor) submits a guess, the backend throws the following error:

```
Error in handlePlayerGuess: Error: Invalid message type for addMessage
    at GameStateManager.addMessage (/backend/src/game/state.ts:104:15)
    at GameHandlers.handlePlayerGuess (/backend/src/socket/handlers/gameHandlers.ts:313:64)
    ...
```

## Context
- The encoder (encryptor) can send hints/messages and the game progresses as expected.
- When the decoder tries to submit a guess, the backend fails to add the guess to the conversation history due to a type mismatch or missing type.

## Root Cause
The issue was in the `handlePlayerGuess` method in `gameHandlers.ts`. When a decoder makes an incorrect guess, the code was calling `addMessage` with a message object that had `content`, `senderId`, `role`, and `turnNumber` properties, but the `addMessage` method expects a `type` field to determine which specific method to call.

The `addMessage` method only accepts these message types:
- `'outsider_hint'` → calls `addOutsiderTurn`
- `'ai_analysis'` → calls `addAITurn` 
- `'insider_guess'` → calls `addInsiderTurn`

## Solution
**Fixed in backend/src/socket/handlers/gameHandlers.ts:**
- Changed the incorrect guess handling to call `addInsiderTurn` directly instead of `addMessage`
- This bypasses the legacy `addMessage` method and uses the proper specific method for decryptor guesses

**Additional Fix - Turn Progression After Scoring:**
- Added `currentTurn` field to `roundEndData` in all three places where rounds end (human wins, AI wins in main handler, AI wins in fallback handler)
- Updated frontend `round_end` event handler to set the current turn when a new round starts
- This ensures the game properly progresses to the next turn after scoring

## Status
- **RESOLVED:** Decoder guesses now work correctly and the game properly progresses after scoring.
- The backend now correctly handles decryptor guesses and turn progression.
