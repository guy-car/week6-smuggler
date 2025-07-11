Room ID should be a string instead of 


previous conversation history isn't clearing from the ui - wait

After encrypter gives a hint, keyboard should hide - wait
When keyboard is shown, text fields should not overlap - wait
Encoder score shows wrong score (as if AI won) - fixed
Modal should show secret when round ends - new feature

Tutorial should be a scroll text - 


 ERROR  Warning: Text strings must be rendered within a <Text> component.

  10 |
  11 | const RoomScreen = () => {
> 12 |     const roomId = useGameStore((s) => s.roomId);
     |                                ^
  13 |     const players = useGameStore((s) => s.players);
  14 |     const player = useGameStore((s) => s.player);
  15 |     const isReady = useGameStore((s) => s.isReady);

Call Stack