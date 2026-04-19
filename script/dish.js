const url = "https://dataportal.livsmedelsverket.se/livsmedel"

// lagrar alla veckans måltider, tex måndag-frukost: [ "kyckling", "ris"]
// varje nyckel är en dag+måltid och värdet en array av ingredienser för just den nyckeln/måltid
const mealData = {} 

const dayOfWeek = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"]
let today = dayOfWeek[new Date().getDay()]

let proteinGoal = 0
let caloriesGoal = 0

let goalButton = document.getElementById("goalButton")
goalButton.addEventListener("click", function(){
    proteinGoal = document.getElementById("proteinGoal").value
    caloriesGoal = document.getElementById("caloriesGoal").value
    updateGoal()
})

let addButtons = document.getElementsByClassName("add-dish-btn")

for (let i = 0; i < addButtons.length; i++)
{
    addButtons[i].addEventListener("click", function() {
        // closest letar DOM-trädet efter närmaste element som matchar selektorn
        // this = knappen för den måltiden som klickades på
        let mealSection = this.closest(".meal-section") 
        let dayColumn = this.closest(".day-column")

        // dataset.meal hämtar värdet från meal-variabeln t.ex frukost
        let meal = mealSection.dataset.meal
        let day = dayColumn.dataset.day

        this.style.display = "none"

        // Wrappern gör att dropdown:en placeras relativt inputfältet och inte hela mealSection
        let inputWrapper = document.createElement("div")
        inputWrapper.className = "input-wrapper"
        mealSection.appendChild(inputWrapper)

        let ingredientInput = document.createElement("input")
        ingredientInput.type = "text"
        ingredientInput.className = "ingredientInput"
        inputWrapper.appendChild(ingredientInput)

        ingredientInput.addEventListener("input", function() {
            searchIngredient(mealSection, inputWrapper)
        })
    })
}

function searchIngredient(mealSection, inputWrapper) {
    // querySelector letar efter ett element inuti mealSection istället för hela sidan
    let getIngredient = mealSection.querySelector(".ingredientInput")
    let ingredientName = getIngredient.value

    if (ingredientName.length >= 2) // börjar kalla API:t efter man skrivit in 2 bokstäver
    {
        fetch(url + "/api/v1/livsmedel?limit=2575")
        .then(function(response) {
            return response.json()
        })
        .then(function(data) {
            let result = data.livsmedel.filter(function(item) {
                return item.namn.toLowerCase().includes(ingredientName.toLowerCase())
            })

            // Sorterar resultaten efter relevans — mest relevanta högst upp
            result.sort(function(a, b) {
                // Kollar om namnet börjar med sökordet följt av mellanslag, komma eller slut
                let regex = new RegExp("^" + ingredientName + "(\\s|,|$)", "i")
                let aExact = regex.test(a.namn)
                let bExact = regex.test(b.namn)

                // Kollar om namnet börjar med sökordet (t.ex. "Ris" i "Rismjöl")
                let aStarts = a.namn.toLowerCase().startsWith(ingredientName.toLowerCase())
                let bStarts = b.namn.toLowerCase().startsWith(ingredientName.toLowerCase())

                // Exakt matchning har högst prioritet
                if (bExact !== aExact) return bExact - aExact

                // Om ingen exakt matchning, prioritera de som börjar med sökordet
                if (bStarts !== aStarts) return bStarts - aStarts

                return 0
            })

            // Hämtar befintlig lista eller skapar en ny inuti inputWrapper
            let ingredientList = inputWrapper.querySelector(".ingredientList")
            if (!ingredientList) {
                ingredientList = document.createElement("ul")
                ingredientList.className = "ingredientList"
                inputWrapper.appendChild(ingredientList)
            }
            ingredientList.innerHTML = ""

            for (let i = 0; i < result.length; i++) {
                let newListItem = document.createElement("li")
                newListItem.textContent = result[i].namn
                newListItem.addEventListener("click", function() {
                    getIngredient.value = ""
                    ingredientList.innerHTML = ""

                    fetch(url + "/api/v1/livsmedel/" + result[i].nummer + "/naringsvarden")
                    .then(function(response) {
                        return response.json()
                    })
                    .then(function(data) {
                        let protein = data.find(function(item){ return item.euroFIRkod === "PROT" })
                        let carbs = data.find(function(item){ return item.euroFIRkod === "CHO" })
                        let fat = data.find(function(item){ return item.euroFIRkod === "FAT" })

                        // ENERC finns två gånger — en för kJ och en för kcal, && filtrerar fram rätt enhet
                        let calories = data.find(function(item){ return item.euroFIRkod === "ENERC" && item.enhet === "kcal" })

                        // Skapar en nyckel för mealData t.ex "måndag-frukost" 
                        // detta för att hålla reda på vilka ingredienser som hör till vilken måltid och dag
                        let meal = mealSection.dataset.meal
                        let day = mealSection.closest(".day-column").dataset.day
                        let key = day + "-" + meal

                        // ifall det inte finns en array för måndag-frukost exempelvis så skapas en tom array
                        if (!mealData[key]) mealData[key] = []

                        // Sparar ingrediensen som ett objekt för att kunna hitta den senare med indexOf
                        let ingredientObj = {
                            ingredient: result[i],
                            gram: 100,
                            protein: protein.varde,
                            carbs: carbs.varde,
                            fat: fat.varde,
                            calories: calories.varde
                        }
                        mealData[key].push(ingredientObj)

                        updateTotal(key, mealSection)

                        let chosen = document.createElement("div")
                        chosen.className = "chosen-ingredient"
                        mealSection.appendChild(chosen)

                        let chosenTitle = document.createElement("h3")
                        chosenTitle.textContent = result[i].namn
                        chosen.appendChild(chosenTitle)

                        let perGram = document.createElement("p")
                        perGram.textContent = "Näringsvärde per 100g"
                        chosen.appendChild(perGram)

                        let caloriesText = document.createElement("p")
                        caloriesText.textContent = "Kalorier: " + calories.varde + "kcal"
                        chosen.appendChild(caloriesText)

                        let proteinText = document.createElement("p")
                        proteinText.textContent = "Protein: " + protein.varde + "g"
                        chosen.appendChild(proteinText)

                        let carbsText = document.createElement("p")
                        carbsText.textContent = "Kolhydrater: " + carbs.varde + "g"
                        chosen.appendChild(carbsText)

                        let fatText = document.createElement("p")
                        fatText.textContent = "Fett: " + fat.varde + "g"
                        chosen.appendChild(fatText)

                        let gramText = document.createElement("span")
                        gramText.textContent = "100g"
                        chosen.appendChild(gramText)

                        let slider = document.createElement("input")
                        slider.type = "range"
                        slider.min = 0
                        slider.max = 1000
                        slider.step = 10
                        slider.value = 100
                        chosen.appendChild(slider)

                        slider.addEventListener("input", function(){
                            // uppdaterar gramvikten direkt på ingrediensobjektet
                            ingredientObj.gram = slider.value

                            let newProtein = protein.varde * slider.value / 100
                            proteinText.textContent = "Protein: " + newProtein.toFixed(1) + "g"

                            let newCarbs = carbs.varde * slider.value / 100
                            carbsText.textContent = "Kolhydrater: " + newCarbs.toFixed(1) + "g"

                            let newFat = fat.varde * slider.value / 100
                            fatText.textContent = "Fett: " + newFat.toFixed(1) + "g"

                            let newCalories = calories.varde * slider.value / 100
                            caloriesText.textContent = "Kalorier: " + newCalories.toFixed(1) + "kcal"

                            gramText.textContent = slider.value + "g"

                            updateTotal(key, mealSection)
                        })

                        let deleteButton = document.createElement("button")
                        deleteButton.type = "button"
                        deleteButton.textContent = "Ta bort"
                        deleteButton.addEventListener("click", function(){
                            // indexOf hittar aktuellt index för ingrediensen, oavsett vad som tagits bort tidigare
                            let currentIndex = mealData[key].indexOf(ingredientObj)
                            mealData[key].splice(currentIndex, 1)
                            chosen.remove()
                            updateTotal(key, mealSection)
                        })
                        chosen.appendChild(deleteButton)
                    })
                })
                ingredientList.appendChild(newListItem)
            }
        })
    }
    else // rensar listan ifall man suddar ut input
    {
        let ingredientList = inputWrapper.querySelector(".ingredientList")
        if (ingredientList) ingredientList.innerHTML = ""
    }
}

function updateTotal(key, mealSection) {
    
    // Hämtar befintlig total-div eller skapar en ny
    let totalMacros = mealSection.querySelector(".totalMacros")
    if (!totalMacros) {
        totalMacros = document.createElement("div")
        totalMacros.className = "totalMacros"
        mealSection.appendChild(totalMacros)
    }

    // ifall mealdata är tom visas ej totala macros
    if (!mealData[key] || mealData[key].length === 0) {
        totalMacros.innerHTML = ""
        return
    }

    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalCalories = 0

    for (let i = 0; i < mealData[key].length; i++) {
        totalProtein += mealData[key][i].protein * mealData[key][i].gram / 100
        totalCarbs += mealData[key][i].carbs * mealData[key][i].gram / 100
        totalFat += mealData[key][i].fat * mealData[key][i].gram / 100
        totalCalories += mealData[key][i].calories * mealData[key][i].gram / 100
    }

    totalMacros.innerHTML =
        "<strong>Totalt</strong><br>" +
        "Kalorier: " + totalCalories.toFixed(1) + "kcal<br>" +
        "Protein: " + totalProtein.toFixed(1) + "g<br>" +
        "Kolhydrater: " + totalCarbs.toFixed(1) + "g<br>" +
        "Fett: " + totalFat.toFixed(1) + "g"
    
        updateGoal()
}

function updateGoal(){
    let meals = ["frukost", "lunch", "middag"]
    let totalCalories = 0                   
    let totalProtein = 0 

    for (i = 0; i < meals.length; i++)
    {
        let key = today.toLowerCase() + "-" + meals[i]
        
        if (mealData[key]) // Kollar först så att det finns en måltid
        {
            for (let j = 0; j < mealData[key].length; j++) 
            {
                totalCalories += mealData[key][j].calories * mealData[key][j].gram / 100           
                totalProtein += mealData[key][j].protein * mealData[key][j].gram / 100
            }
        }
        document.getElementById("sidebar-right-goals").innerHTML =                                 
        totalCalories.toFixed(1) + " / " + caloriesGoal + " kcal<br>" +                      
        totalProtein.toFixed(1) + " / " + proteinGoal + " g protein"    
    }
}