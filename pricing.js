// pricing.js - fallback cennika Klasyk Portowy Barber Shop
// Główne źródło danych to data/pricing.json. Podmień ten plik lub JSON, aby zaktualizować ceny.

window.PRICING_DATA = {
    categories: ["Czas", "Cena"],
    tables: [
        {
            title: "Cennik usług",
            items: [
                { name: "Strzyżenie włosów", prices: ["45 min", "100 zł"] },
                { name: "Strzyżenie brody", prices: ["30 min", "80 zł"] },
                { name: "Broda SPA | strzyżenie (brzytwa, ozon, relaks)", prices: ["45 min", "110 zł"] },
                { name: "Combo | włosy + broda", prices: ["1 h 15 min", "160 zł"] },
                { name: "Combo SPA | włosy + broda (brzytwa, ozon, relaks)", prices: ["1 h 30 min", "190 zł"] },
                { name: "Combo + repigmentacja | włosy + broda", prices: ["1 h 30 min", "200 zł"] },
                { name: "Combo ojciec + strzyżenie syn | do 10 lat", prices: ["2 h", "220 zł"] },
                { name: "Strzyżenie włosów + repigmentacja | odsiwianie", prices: ["1 h", "140 zł"] },
                { name: "Strzyżenie włosów ojciec + syn | do 10 lat", prices: ["1 h 15 min", "170 zł"] },
                { name: "Broda + repigmentacja | odsiwianie", prices: ["45 min", "120 zł"] },
                { name: "Mycie + stylizacja włosów", prices: ["15 min", "30 zł"] },
                { name: "Przycinanie wąsa", prices: ["15 min", "30 zł"] },
                { name: "Strzyżenie dziecięce", prices: ["30 min", "80 zł"] }
            ]
        }
    ],
    singleItems: []
};
