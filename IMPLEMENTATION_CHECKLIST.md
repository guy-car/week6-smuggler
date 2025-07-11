# Smuggler Game Implementation Checklist

## Overview
This checklist covers the implementation of the correct 4-step turn cycle for the Smuggler word-guessing game. The current implementation has a bug where the turn advancement logic uses a 3-step cycle instead of the required 4-step cycle.

## Current Problem
- **Current turn cycle**: `encoder → ai → decoder → encoder` (3-step cycle)
- **Required turn cycle**: `encoder → ai → decoder → ai → encoder` (4-step cycle)
- **Root cause**: The `advanceTurn` method in `GameStateManager` uses a simple array rotation instead of implementing the correct 4-step logic

## Implementation Checklist

### 🔧 Backend Changes

#### 1. Fix GameStateManager.advanceTurn Method
**File**: `backend/src/game/state.ts`
**Status**: ❌ **NOT STARTED**

**Current Implementation**:
```typescript
public advanceTurn(gameState: GameState): GameState {
    const turnOrder: ('encoder' | 'ai' | 'decoder')[] = ['encoder', 'ai', 'decoder'];
    const currentIndex = turnOrder.indexOf(gameState.currentTurn);
    const nextIndex = (currentIndex + 1) % turnOrder.length;

    return {
        ...gameState,
        currentTurn: turnOrder[nextIndex]!
    };
}
```

**Required Changes**:
- [ ] Replace the simple array rotation with explicit 4-step cycle logic
- [ ] Implement the correct turn progression:
  - `encoder` → `ai`
  - `ai` → `decoder` 
  - `decoder` → `ai`
  - `ai` → `encoder`
- [ ] Add comprehensive logging for turn transitions
- [ ] Add validation to ensure turn progression follows the 4-step cycle

**New Implementation**:
```typescript
public advanceTurn(gameState: GameState): GameState {
    let nextTurn: 'encoder' | 'ai' | 'decoder';
    
    switch (gameState.currentTurn) {
        case 'encoder':
            nextTurn = 'ai';
            break;
        case 'ai':
            nextTurn = 'decoder';
            break;
        case 'decoder':
            nextTurn = 'ai';
            break;
        default:
            throw new Error(`Invalid current turn: ${gameState.currentTurn}`);
    }
    
    console.log(`[DEBUG] advanceTurn: ${gameState.currentTurn} → ${nextTurn}`);
    
    return {
        ...gameState,
        currentTurn: nextTurn
    };
}
```

#### 2. Update GameLogic.handleDecoderGuess Method
**File**: `backend/src/game/logic.ts`
**Status**: ❌ **NOT STARTED**

**Current Implementation**:
```typescript
// For incorrect decoder guess, we want to go back to AI, not to encoder
const updatedGameState = {
    ...messageAdded,
    currentTurn: 'ai' as const
};
```

**Required Changes**:
- [ ] Remove the manual turn setting and use `advanceTurn` method instead
- [ ] Ensure consistency with the new 4-step cycle logic
- [ ] Add logging for turn transitions

**New Implementation**:
```typescript
// Use the advanceTurn method for consistency
const updatedGameState = this.gameStateManager.advanceTurn(messageAdded);
```

#### 3. Update GameHandlers.handleAIResponse Method
**File**: `backend/src/socket/handlers/gameHandlers.ts`
**Status**: ❌ **NOT STARTED**

**Current Implementation**:
```typescript
// AI incorrect - advance turn to decryptor
const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);
```

**Required Changes**:
- [ ] Verify that the advanceTurn method now correctly advances to the next player in the 4-step cycle
- [ ] Add logging to track turn transitions
- [ ] Ensure AI responses after decoder guesses advance to encoder (not decoder)

#### 4. Update GameHandlers.handleAIFallback Method
**File**: `backend/src/socket/handlers/gameHandlers.ts`
**Status**: ❌ **NOT STARTED**

**Required Changes**:
- [ ] Same changes as handleAIResponse method
- [ ] Ensure fallback AI responses follow the same 4-step cycle logic

### 🧪 Testing Updates

#### 5. Update GameState Tests
**File**: `backend/tests/gameState.test.ts`
**Status**: ❌ **NOT STARTED**

**Required Changes**:
- [ ] Update `advanceTurn` tests to verify 4-step cycle instead of 3-step cycle
- [ ] Add test cases for the complete 4-step cycle: `encoder → ai → decoder → ai → encoder`
- [ ] Add test cases for edge cases and error conditions
- [ ] Verify that turn progression is correct after each step

**New Test Cases**:
```typescript
describe('advanceTurn', () => {
    it('should follow 4-step cycle correctly', () => {
        const gameState = gameStateManager.createGameState('TestWord', []);
        
        // Start with encoder
        expect(gameState.currentTurn).toBe('encoder');
        
        // encoder → ai
        let currentState = gameStateManager.advanceTurn(gameState);
        expect(currentState.currentTurn).toBe('ai');
        
        // ai → decoder
        currentState = gameStateManager.advanceTurn(currentState);
        expect(currentState.currentTurn).toBe('decoder');
        
        // decoder → ai
        currentState = gameStateManager.advanceTurn(currentState);
        expect(currentState.currentTurn).toBe('ai');
        
        // ai → encoder (cycle repeats)
        currentState = gameStateManager.advanceTurn(currentState);
        expect(currentState.currentTurn).toBe('encoder');
    });
});
```

#### 6. Update GameLogic Tests
**File**: `backend/tests/gameState.test.ts`
**Status**: ❌ **NOT STARTED**

**Required Changes**:
- [ ] Update `handleDecoderGuess` tests to verify correct turn advancement
- [ ] Add test cases for the complete game flow with 4-step cycle
- [ ] Verify that AI responses after decoder guesses advance to encoder

#### 7. Update Integration Tests
**File**: `backend/tests/integration.test.ts`
**Status**: ❌ **NOT STARTED**

**Required Changes**:
- [ ] Add comprehensive integration tests for the complete 4-step cycle
- [ ] Test the full game flow: encoder → ai → decoder → ai → encoder
- [ ] Verify that AI responses are triggered correctly after both encoder messages and decoder guesses
- [ ] Test edge cases and error conditions

### 🔍 Frontend Verification

#### 8. Verify Frontend Turn Display
**Files**: 
- `frontend/app/components/GameStatusIndicator.tsx`
- `frontend/store/gameStore.ts`
- `frontend/services/websocket.ts`

**Status**: ❌ **NOT STARTED**

**Required Changes**:
- [ ] Verify that the frontend correctly displays the 4-step turn cycle
- [ ] Ensure turn indicators show the correct progression
- [ ] Test that AI turns are properly triggered and displayed
- [ ] Verify that the conversation flow matches the 4-step cycle

#### 9. Test Complete Game Flow
**Status**: ❌ **NOT STARTED**

**Required Changes**:
- [ ] Test the complete game flow manually
- [ ] Verify that AI responds after both encoder messages and decoder guesses
- [ ] Ensure the turn cycle repeats correctly: encoder → ai → decoder → ai → encoder
- [ ] Test edge cases like correct guesses and round transitions

### 📋 Validation Checklist

#### 10. Functional Validation
**Status**: ❌ **NOT STARTED**

- [ ] **Turn Progression**: Verify that turns advance in the correct 4-step cycle
- [ ] **AI Responses**: Confirm AI responds after both encryptor messages and decryptor guesses
- [ ] **Turn Indicators**: Ensure frontend displays the correct current turn
- [ ] **Game Flow**: Test complete rounds with multiple cycles
- [ ] **Round Transitions**: Verify turn resets to encryptor after round ends
- [ ] **Error Handling**: Test invalid turn transitions and edge cases

#### 11. Technical Validation
**Status**: ❌ **NOT STARTED**

- [ ] **Backend Logic**: Verify advanceTurn method implements correct 4-step cycle
- [ ] **Socket Events**: Ensure turn updates are properly emitted
- [ ] **State Management**: Confirm game state is consistent throughout the cycle
- [ ] **Logging**: Verify debug logs show correct turn transitions
- [ ] **Performance**: Ensure no performance degradation with new logic

#### 12. Integration Validation
**Status**: ❌ **NOT STARTED**

- [ ] **End-to-End Flow**: Test complete game from start to finish
- [ ] **Multi-Player**: Verify turn progression works with multiple players
- [ ] **Real-time Updates**: Ensure all players see correct turn progression
- [ ] **AI Integration**: Verify AI service is called at the right times
- [ ] **Error Recovery**: Test behavior when AI service fails

### 🚀 Deployment Checklist

#### 13. Pre-Deployment
**Status**: ❌ **NOT STARTED**

- [ ] **Code Review**: Review all changes for correctness and consistency
- [ ] **Testing**: Run all tests and verify they pass
- [ ] **Manual Testing**: Test complete game flow manually
- [ ] **Documentation**: Update any relevant documentation
- [ ] **Backup**: Ensure current working state is backed up

#### 14. Deployment
**Status**: ❌ **NOT STARTED**

- [ ] **Backend Deployment**: Deploy backend changes
- [ ] **Frontend Deployment**: Deploy frontend changes (if any)
- [ ] **Environment Variables**: Verify all environment variables are set correctly
- [ ] **Service Health**: Check that all services are running properly

#### 15. Post-Deployment
**Status**: ❌ **NOT STARTED**

- [ ] **Monitoring**: Monitor logs for any errors or issues
- [ ] **User Testing**: Have users test the complete game flow
- [ ] **Performance Monitoring**: Monitor for any performance issues
- [ ] **Bug Reports**: Address any issues that arise

## Success Criteria

### Primary Goals
- [ ] **Correct Turn Cycle**: Game follows the 4-step cycle: encryptor → ai → decryptor → ai → encryptor
- [ ] **AI Responses**: AI responds after both encryptor messages and decryptor guesses
- [ ] **Consistent State**: Game state remains consistent throughout the turn cycle
- [ ] **Real-time Updates**: All players see correct turn progression in real-time

### Secondary Goals
- [ ] **Performance**: No performance degradation with new logic
- [ ] **Reliability**: Robust error handling and edge case management
- [ ] **Maintainability**: Clean, well-documented code with comprehensive tests
- [ ] **User Experience**: Smooth, intuitive game flow for all players

## Timeline Estimate

- **Backend Changes**: 2-3 hours
- **Testing Updates**: 1-2 hours  
- **Frontend Verification**: 1 hour
- **Integration Testing**: 1-2 hours
- **Deployment & Validation**: 1 hour

**Total Estimated Time**: 6-9 hours

## Notes

- The main issue is in the `advanceTurn` method - this is the core fix needed
- All other changes are supporting updates to ensure consistency
- Testing is critical to verify the fix works correctly
- The frontend should work correctly once the backend logic is fixed
- Monitor logs carefully during testing to verify turn transitions 