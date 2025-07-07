"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.generateRoomId = generateRoomId;
exports.isValidRoomId = isValidRoomId;
exports.isValidPlayerName = isValidPlayerName;
exports.sanitizePlayerName = sanitizePlayerName;
exports.getCurrentTimestamp = getCurrentTimestamp;
exports.isOlderThan = isOlderThan;
exports.deepClone = deepClone;
exports.debounce = debounce;
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
function generateRoomId() {
    return `room_${generateId()}`;
}
function isValidRoomId(roomId) {
    return typeof roomId === 'string' && roomId.length > 0 && roomId.startsWith('room_');
}
function isValidPlayerName(name) {
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50;
}
function sanitizePlayerName(name) {
    return name.trim().substring(0, 50);
}
function getCurrentTimestamp() {
    return new Date();
}
function isOlderThan(date, milliseconds) {
    return Date.now() - date.getTime() > milliseconds;
}
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
//# sourceMappingURL=helpers.js.map