const url = "https://dataportal.livsmedelsverket.se/livsmedel"

// Populära rätter med nummer från Livsmedelsverkets API och portionsstorlek i gram
const popularDishes = [
    { namn: "Kycklinggryta m. grädde/crème fraiche", nummer: 2863, gram: 400 },
    { namn: "Spagetti m. köttfärssås", nummer: 858, gram: 400 },
    { namn: "Fläskpannkaka", nummer: 739, gram: 400 }
]

for (let i = 0; i < popularDishes.length; i++) {
    let dish = popularDishes[i]

    fetch(url + "/api/v1/livsmedel/" + dish.nummer + "/naringsvarden")
    .then(function(response) {
        return response.json()
    })
    .then(function(data) {
        let protein = data.find(function(item){ return item.euroFIRkod === "PROT" })
        let carbs = data.find(function(item){ return item.euroFIRkod === "CHO" })
        let fat = data.find(function(item){ return item.euroFIRkod === "FAT" })

        // ENERC finns två gånger — en för kJ och en för kcal, && filtrerar fram rätt enhet
        let calories = data.find(function(item){ return item.euroFIRkod === "ENERC" && item.enhet === "kcal" })

        // Räknar om näringsvärden från per 100g till per portion
        let portionProtein = (protein.varde * dish.gram / 100).toFixed(1)
        let portionCarbs = (carbs.varde * dish.gram / 100).toFixed(1)
        let portionFat = (fat.varde * dish.gram / 100).toFixed(1)
        let portionCalories = (calories.varde * dish.gram / 100).toFixed(1)

        let card = document.createElement("div")
        card.className = "dish-card"

        let title = document.createElement("h3")
        title.textContent = dish.namn
        card.appendChild(title)

        let portion = document.createElement("p")
        portion.textContent = "Per portion (" + dish.gram + "g)"
        card.appendChild(portion)

        let caloriesText = document.createElement("p")
        caloriesText.textContent = "Kalorier: " + portionCalories + " kcal"
        card.appendChild(caloriesText)

        let proteinText = document.createElement("p")
        proteinText.textContent = "Protein: " + portionProtein + "g"
        card.appendChild(proteinText)

        let carbsText = document.createElement("p")
        carbsText.textContent = "Kolhydrater: " + portionCarbs + "g"
        card.appendChild(carbsText)

        let fatText = document.createElement("p")
        fatText.textContent = "Fett: " + portionFat + "g"
        card.appendChild(fatText)

        document.getElementById("dishes-container").appendChild(card)
    })
}
