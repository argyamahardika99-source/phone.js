// script_files/buyers.js

export const BUYERS = [
    {
        id: "el_moreno",
        name: "El Moreno",
        trust: 50,
        vip: false
    },
    {
        id: "mateo_cruz",
        name: "Mateo Cruz",
        trust: 50,
        vip: false
    },
    {
        id: "rafa_solis",
        name: "Rafa Solis",
        trust: 50,
        vip: false
    },
    {
        id: "nico_vega",
        name: "Nico Vega",
        trust: 50,
        vip: false
    },
    {
        id: "sombra",
        name: "Sombra",
        trust: 50,
        vip: false
    },
    {
        id: "valdez",
        name: "Valdez",
        trust: 50,
        vip: false
    },
    {
        id: "el_coyote",
        name: "El Coyote",
        trust: 60,
        vip: true
    },
    {
        id: "marco_viera",
        name: "Marco Viera",
        trust: 70,
        vip: true
    }
];

export function getRandomBuyer(vip = false) {
    const pool = vip
        ? BUYERS.filter(b => b.vip)
        : BUYERS.filter(b => !b.vip);

    return pool[Math.floor(Math.random() * pool.length)];
}
// script_files/buyers.js

export const BUYER_MESSAGES = {

    greeting: [
        "Need something.",
        "Yo, got stock?",
        "Need supplies.",
        "You available?",
        "Need a quick delivery."
    ],

    accepted: [
        "Good. I'll send the location.",
        "Perfect. Stand by.",
        "I'll contact you again.",
        "Don't be late."
    ],

    completed: [
        "Pleasure doing business.",
        "Nice work.",
        "Clean delivery.",
        "We'll talk again."
    ],

    failed: [
        "Forget it.",
        "Too slow.",
        "Deal cancelled.",
        "I'll find someone else."
    ]

};

export function getRandomMessage(type) {

    const list = BUYER_MESSAGES[type];

    return list[Math.floor(Math.random() * list.length)];

}