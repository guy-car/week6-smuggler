# Frontend Issues Documentation

## Issue 1: Lobby Not Updating When Rooms Are Created

### Current Behavior
- When a user creates a room in one browser, the room list in other browsers (incognito/regular) does not automatically update
- Users must manually refresh or navigate away and back to see new rooms
- The lobby appears to be disconnected from real-time room creation events

### Desired Behavior
- When any user creates a room, all users in the lobby should immediately see the new room appear in the available rooms list
- Real-time updates should work across different browser sessions (regular and incognito)
- No manual refresh should be required

### Root Cause Analysis
**CRITICAL FINDING**: The frontend is **NOT** emitting the `enter_lobby` event when the lobby component mounts. This is the primary cause of the issue.

**Detailed Investigation Results:**

1. **Missing Lobby Entry Event**: 
   - The frontend lobby component only calls `getAvailableRooms()` when connected
   - It does NOT emit `enter_lobby` event to register with the backend lobby system
   - The backend has a complete lobby tracking system (`LobbyHandlers`) that tracks clients in lobby
   - The backend expects clients to emit `enter_lobby` to be added to the lobby client set

2. **Backend Lobby System is Complete**:
   - `LobbyHandlers` properly tracks clients in `lobbyClients` Set
   - `broadcastRoomList()` method exists and is called via room change callback
   - Room change callback is properly set up in `server.ts`
   - `triggerRoomChange()` is called when rooms are created/updated

3. **Event Flow Breakdown**:
   - Frontend calls `getAvailableRooms()` → emits `list_rooms` → gets one-time room list
   - Frontend does NOT emit `enter_lobby` → never gets added to lobby client tracking
   - When rooms change, `broadcastRoomList()` only sends to tracked lobby clients
   - Since frontend isn't tracked, it never receives updates

4. **Socket Event Mismatches**:
   - Frontend emits `room:ready` but backend expects `player_ready`
   - Frontend emits `room:leave` but backend has no handler for this event
   - These mismatches affect other functionality but not the lobby update issue

### Solutions
1. **IMMEDIATE FIX**: Add `enter_lobby` event emission in lobby component `useEffect`
2. **Add `leave_lobby` event**: Emit when component unmounts or user navigates away
3. **Fix Event Name Mismatches**: 
   - Change `room:ready` to `player_ready` in frontend
   - Add `room:leave` handler in backend or change to existing event
4. **Add Error Handling**: Implement proper error handling for socket events

---

## Issue 2: Ready Button Not Functioning

### Current Behavior
- Clicking the "Ready" button in the room screen appears to do nothing
- No visual feedback or state change occurs
- The button doesn't toggle between "Ready" and "Unready" states
- Other players don't see the ready status change

### Desired Behavior
- Clicking "Ready" should toggle the player's ready status
- Visual feedback should show the current ready state
- Other players in the room should see the ready status change in real-time
- The button should change appearance and text based on ready state

### Root Cause Analysis
**CRITICAL FINDING**: The frontend is emitting the wrong event name for player ready status.

**Detailed Investigation Results:**

1. **Event Name Mismatch**:
   - Frontend emits: `room:ready` with `{ ready }` data
   - Backend expects: `player_ready` with `{ roomId }` data
   - The backend handler exists and is properly set up in `server.ts`

2. **Missing Required Data**:
   - Frontend sends: `{ ready: boolean }`
   - Backend expects: `{ roomId: string }`
   - The backend needs roomId to identify which room the player is in

3. **Backend Handler is Complete**:
   - `handlePlayerReady` method exists and is properly registered
   - It calls `roomManager.setPlayerReady(roomId, socket.id)`
   - It emits success/error events back to the client
   - It notifies other players in the room

4. **State Management Issues**:
   - Frontend state updates depend on receiving `player_ready_success` event
   - Since the wrong event is emitted, the backend never processes it
   - No success event is sent back, so frontend state never updates

### Solutions
1. **IMMEDIATE FIX**: Change frontend to emit `player_ready` instead of `room:ready`
2. **Add Required Data**: Include `roomId` in the event data from frontend state
3. **Add Event Listeners**: Ensure frontend listens for `player_ready_success` and `player_ready_error` events
4. **Update State Management**: Properly update local state based on backend responses

---

## Issue 3: Room Selection UX Issue

### Current Behavior
- Available rooms show a "Select" button that only populates the room ID input field
- Users must then click "Join Room" to actually join the selected room
- This creates an unnecessary two-step process

### Desired Behavior
- Available rooms should have a "Join Room" button that directly joins the room
- Eliminate the intermediate step of selecting a room ID
- Streamline the user experience for joining existing rooms

### Potential Causes
1. **UI Design Decision**: The current implementation was designed with a two-step process
2. **Missing Direct Join Functionality**: No direct join function exists for room items

### Solutions
1. **Replace "Select" with "Join Room"**: Change the button text and functionality
2. **Implement Direct Join**: Call the join room function directly when the button is clicked
3. **Remove Room ID Input**: The room ID input field becomes unnecessary for joining existing rooms
4. **Keep Room ID Input for Manual Entry**: Still allow users to manually enter room IDs if needed

---

## Issue 4: Leave Room Button Not Working

### Current Behavior
- Clicking the "Leave Room" button shows a confirmation dialog
- After confirming, the user remains in the room
- No navigation back to lobby occurs
- The socket connection to the room is not properly terminated

### Desired Behavior
- Clicking "Leave Room" should show a confirmation dialog
- After confirming, the user should be removed from the room
- Navigation should return to the lobby
- The socket should properly leave the room and update other players

### Root Cause Analysis
**CRITICAL FINDING**: The frontend is emitting `room:leave` but the backend has no handler for this event.

**Detailed Investigation Results:**

1. **Missing Backend Handler**:
   - Frontend emits: `room:leave` event
   - Backend has NO handler registered for `room:leave` in `server.ts`
   - The event is completely ignored by the backend

2. **Existing Backend Infrastructure**:
   - `RoomManager.removePlayer()` method exists and works correctly
   - `RoomHandlers.handleDisconnect()` exists for handling disconnections
   - The backend can remove players, but only through disconnect events

3. **Event Flow Breakdown**:
   - Frontend emits `room:leave` → backend ignores it → no player removal
   - User remains in room on backend → no navigation occurs
   - State cleanup doesn't happen because backend doesn't process the event

4. **Navigation Issues**:
   - Navigation depends on successful room leaving
   - Since backend doesn't process the event, navigation doesn't trigger
   - User stays in room screen with no feedback

### Solutions
1. **IMMEDIATE FIX**: Add `room:leave` event handler in backend `server.ts`
2. **Implement Handler Logic**: Create handler that calls `roomManager.removePlayer()`
3. **Add Success/Error Events**: Emit events back to frontend for proper state management
4. **Fix Navigation**: Ensure navigation happens after successful leave confirmation
5. **Add State Cleanup**: Reset all game state when leaving room

---

## Technical Implementation Notes

### Critical Socket Event Mismatches Found

| Frontend Event | Backend Handler | Status | Issue |
|----------------|-----------------|---------|-------|
| `enter_lobby` | `handleEnterLobby` | ❌ **MISSING** | Frontend never emits this event |
| `room:ready` | `handlePlayerReady` | ❌ **MISMATCH** | Frontend emits wrong event name |
| `room:leave` | None | ❌ **MISSING** | No backend handler exists |
| `list_rooms` | `handleListRooms` | ✅ **WORKING** | This one works correctly |

### Root Cause Summary
The primary issue is that the frontend and backend have **incompatible event naming conventions**:

1. **Frontend uses colon notation**: `room:ready`, `room:leave`
2. **Backend uses underscore notation**: `player_ready`, `enter_lobby`

This mismatch means most events are either not emitted or not processed, breaking the real-time functionality.

### State Management Issues
- The Zustand store needs proper state updates for all room operations
- State synchronization between different browser sessions needs improvement
- Error states and loading states need better management
- Missing event listeners for backend success/error responses

### UI/UX Improvements Needed
- Better visual feedback for all user actions
- Loading indicators for async operations
- Error messages for failed operations
- Consistent button states and interactions

### Testing Recommendations
- Test socket connections across different browser sessions
- Verify real-time updates work properly
- Test error scenarios and edge cases
- Ensure proper cleanup on component unmount
- Add comprehensive socket event testing

### Priority Fix Order
1. **HIGHEST**: Fix `enter_lobby` event emission (lobby updates)
2. **HIGH**: Fix `player_ready` event name (ready button)
3. **HIGH**: Add `room:leave` handler (leave room)
4. **MEDIUM**: Add missing event listeners for success/error responses
5. **LOW**: UI/UX improvements and error handling

---

## Step-by-Step Fix Checklist

### Phase 1: Fix Lobby Updates (Issue 1)
**Goal**: Enable real-time room list updates across all browser sessions

#### Step 1.1: Add Lobby Entry Event
- [x] **File**: `frontend/app/lobby/index.tsx`
- [x] **Action**: Add `enter_lobby` event emission in `useEffect`
- [x] **Test**: Added test for lobby entry/exit events in `test/lobbyUpdates.test.ts`
- [x] **Code**: Import `getSocket` from websocket service
- [x] **Code**: Add `getSocket().emit('enter_lobby')` when component mounts
- [x] **Code**: Add `getSocket().emit('leave_lobby')` in cleanup function

#### Step 1.2: Add Lobby Leave Event
- [x] **File**: `frontend/app/lobby/index.tsx`
- [x] **Action**: Add cleanup effect to emit `leave_lobby` on unmount
- [x] **Code**: Use `useEffect` cleanup function to emit `leave_lobby`

#### Step 1.3: Test Lobby Updates
- [ ] **Test**: Open lobby in two different browser sessions
- [ ] **Test**: Create room in one session
- [ ] **Test**: Verify room appears immediately in other session
- [ ] **Test**: Verify room disappears when creator leaves

### Phase 2: Fix Ready Button (Issue 2)
**Goal**: Make ready/unready functionality work properly

#### Step 2.1: Fix Event Name Mismatch
- [ ] **File**: `frontend/services/websocket.ts`
- [ ] **Action**: Change `room:ready` to `player_ready` in `setPlayerReady` function
- [ ] **Code**: Update event emission from `socket.emit('room:ready', { ready })` to `socket.emit('player_ready', { roomId })`

#### Step 2.2: Add Required Data
- [ ] **File**: `frontend/services/websocket.ts`
- [ ] **Action**: Include `roomId` in the event data
- [ ] **Code**: Get `roomId` from game store: `const roomId = useGameStore.getState().roomId`

#### Step 2.3: Add Event Listeners
- [ ] **File**: `frontend/services/websocket.ts`
- [ ] **Action**: Add listeners for `player_ready_success` and `player_ready_error`
- [ ] **Code**: Add socket listeners in `getSocket()` function
- [ ] **Code**: Update local state based on backend responses

#### Step 2.4: Test Ready Functionality
- [ ] **Test**: Join a room with two players
- [ ] **Test**: Click ready button in one session
- [ ] **Test**: Verify ready status updates in both sessions
- [ ] **Test**: Verify button text changes appropriately

### Phase 3: Fix Leave Room (Issue 4)
**Goal**: Make leave room button functional

#### Step 3.1: Add Backend Handler
- [ ] **File**: `backend/src/socket/handlers/roomHandlers.ts`
- [ ] **Action**: Add `handleLeaveRoom` method
- [ ] **Code**: Create method that calls `roomManager.removePlayer()`
- [ ] **Code**: Emit success/error events back to client

#### Step 3.2: Register Event Handler
- [ ] **File**: `backend/src/server.ts`
- [ ] **Action**: Add `room:leave` event handler registration
- [ ] **Code**: Add `socket.on('room:leave', (data) => roomHandlers.handleLeaveRoom(socket, data))`

#### Step 3.3: Add Frontend Event Listeners
- [ ] **File**: `frontend/services/websocket.ts`
- [ ] **Action**: Add listeners for leave room success/error events
- [ ] **Code**: Add socket listeners in `getSocket()` function
- [ ] **Code**: Handle navigation and state cleanup on success

#### Step 3.4: Test Leave Room
- [ ] **Test**: Join a room
- [ ] **Test**: Click leave room button
- [ ] **Test**: Verify navigation back to lobby
- [ ] **Test**: Verify other players are notified

### Phase 4: Fix Room Selection UX (Issue 3)
**Goal**: Streamline room joining process

#### Step 4.1: Update Room List UI
- [ ] **File**: `frontend/app/lobby/index.tsx`
- [ ] **Action**: Change "Select" button to "Join Room"
- [ ] **Code**: Update button text and functionality
- [ ] **Code**: Call `joinRoom()` directly instead of setting room ID

#### Step 4.2: Test Room Joining
- [ ] **Test**: Create a room in one session
- [ ] **Test**: Click "Join Room" button in other session
- [ ] **Test**: Verify direct navigation to room

### Phase 5: Add Error Handling & Polish
**Goal**: Improve user experience with proper error handling

#### Step 5.1: Add Loading States
- [ ] **File**: `frontend/app/lobby/index.tsx`
- [ ] **Action**: Add loading indicators for all async operations
- [ ] **Code**: Show loading state during room creation/joining

#### Step 5.2: Add Error Messages
- [ ] **File**: `frontend/app/lobby/index.tsx`
- [ ] **Action**: Display error messages for failed operations
- [ ] **Code**: Show user-friendly error messages

#### Step 5.3: Add Connection Status
- [ ] **File**: `frontend/app/lobby/index.tsx`
- [ ] **Action**: Show connection status to user
- [ ] **Code**: Display when disconnected/reconnecting

### Testing Checklist
- [ ] **Cross-browser Testing**: Test with regular and incognito browsers
- [ ] **Real-time Updates**: Verify all updates happen immediately
- [ ] **Error Scenarios**: Test network disconnections, invalid room IDs
- [ ] **State Cleanup**: Verify proper cleanup when leaving rooms
- [ ] **Navigation**: Test all navigation flows work correctly

### Deployment Notes
- [ ] **Backend**: Restart backend server after adding new event handlers
- [ ] **Frontend**: Clear browser cache after making changes
- [ ] **Environment**: Verify backend URL is correct in frontend config
