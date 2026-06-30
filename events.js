// script_files/events.js

export const EVENTS = [
    {
        id: "normal",
        title: "Normal Day",
        rewardMultiplier: 1.0
    },
    {
        id: "high_demand",
        title: "High Demand",
        rewardMultiplier: 1.25
    },
    {
        id: "market_crash",
        title: "Market Crash",
        rewardMultiplier: 0.75
    },
    {
        id: "police_patrol",
        title: "Police Patrol Increased",
        rewardMultiplier: 1.10
    }
];

export function getRandomEvent() {
    return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}