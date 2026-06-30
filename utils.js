// script_files/utils.js

export function random(array) {
    return array[Math.floor(Math.random() * array.length)];
}

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function generateOrderId() {
    return `ORD-${Date.now()}-${randomInt(100, 999)}`;
}