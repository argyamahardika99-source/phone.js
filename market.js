// script_files/market.js

export const MARKET = [
    {
        id: "weed",
        item: "nirvana:weed",
        display: "Weed",
        minPrice: 65,
        maxPrice: 95
    },
    {
        id: "weed_bud",
        item: "nirvana:weed_bud",
        display: "Weed Bud",
        minPrice: 100,
        maxPrice: 145
    },
    {
        id: "beck",
        item: "nirvana:beck",
        display: "Beck",
        minPrice: 180,
        maxPrice: 240
    },
    {
        id: "bong",
        item: "nirvana:bong",
        display: "Bong",
        minPrice: 420,
        maxPrice: 580
    }
];

export function getRandomProduct() {
    return MARKET[Math.floor(Math.random() * MARKET.length)];
}

export function getRandomPrice(product) {
    return Math.floor(
        Math.random() * (product.maxPrice - product.minPrice + 1)
    ) + product.minPrice;
}