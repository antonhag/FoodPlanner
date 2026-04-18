const url = "https://dataportal.livsmedelsverket.se/livsmedel"

const selectedIngredients = []

let proteinGoal = 0
let caloriesGoal = 0

let formDish = document.getElementById("dishForm")
formDish.addEventListener("submit", createDish)

function createDish(event){
    let getDish = document.getElementById("dishName")
    let dishName = getDish.value
    event.preventDefault() // gör så att webbläsaren ej refreshar efter man lagt till en maträtt

    let ingredients = "<form id='ingredientsForm'>"
    ingredients += "<label for='ingredientsName' id='ingredientsLabel'>"
    ingredients += "<input name='ingredientsName' type='text' id='ingredientInput'>"
    ingredients += "<div id='ingredientList'></div>"
    ingredients += "</form>"

    formDish.insertAdjacentHTML("afterend", ingredients)
    let formIngredient = document.getElementById("ingredientsForm")
    formIngredient.addEventListener("submit", addIngredient)

    let inputIngredient = document.getElementById("ingredientInput")
    inputIngredient.addEventListener("input", searchIngredient)

    console.log(dishName)
}

function addIngredient(event){
    let getIngredient = document.getElementById("ingredientInput")
    let ingredientName = getIngredient.value
    event.preventDefault()

    searchIngredient(ingredientName)

    console.log(ingredientName)
}

function searchIngredient(event){

    let getIngredient = document.getElementById("ingredientInput")
    let ingredientName = getIngredient.value

    if (ingredientName.length >= 2) // börjar kalla API:t efter man skrivit in 2 bokstäver
        {
            fetch(url + "/api/v1/livsmedel?limit=2575")
            .then(
                function(response)
                {
                    return response.json()
                }
            )   
            .then(
                function(data)
                {
                    console.log(data)
                    let result = data.livsmedel.filter(function(item){
                        return item.namn.toLowerCase().includes(ingredientName.toLowerCase())
                    })
    
                    // Sorterar resultaten efter relevans — mest relevanta högst upp
                    result.sort(function(a, b) {
                        // Kollar om namnet börjar med sökordet följt av mellanslag, komma eller slut
                        // (t.ex. "ris" matchar "Ris kokt" men inte "Riskaka")
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
    
                        // Annars spelar ordningen ingen roll
                        return 0
                    })
    
                    document.getElementById("ingredientList").innerHTML = ""                                                  
    
                    for (let i = 0; i < result.length; i++)
                        {
                            let newListItem = document.createElement("li")
                            newListItem.textContent = result[i].namn
                            newListItem.addEventListener("click", function() {
                                console.log(selectedIngredients)
                                document.getElementById("ingredientInput").value = ""
                                document.getElementById("ingredientList").innerHTML = ""
                                
                                let chosen = document.createElement("li")
                                chosen.textContent = result[i].namn
                                document.getElementById("chosenIngredients").appendChild(chosen)

                                fetch (url + "/api/v1/livsmedel/" + result[i].nummer + "/naringsvarden")
                                    .then(
                                        function(response){
                                            return response.json()
                                        }
                                    )
                                    .then(
                                        function(data)
                                        {
                                            let protein = data.find(function(item){
                                                return item.euroFIRkod === "PROT"
                                            })
                                            let carbs = data.find(function(item){
                                                return item.euroFIRkod === "CHO"
                                            })
                                            let fat = data.find(function(item){
                                                return item.euroFIRkod === "FAT"
                                            })
                                            
                                            // ENERC finns två gånger — en för kJ och en för kcal, && filtrerar fram rätt enhet
                                            let calories = data.find(function(item){
                                                return item.euroFIRkod === "ENERC" && item.enhet === "kcal"
                                            })

                                            selectedIngredients.push({ 
                                                ingredient: result[i],
                                                gram: 100,
                                                protein: protein.varde,
                                                carbs: carbs.varde,
                                                fat: fat.varde,
                                                calories: calories.varde,
                                            })

                                            updateTotal()

                                            // För att hålla koll på vilken ingrediens man ändrar med slidern sedan
                                            let index = selectedIngredients.length - 1 

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
                                            
                                            let slider = document.createElement("input")
                                            slider.type = "range"
                                            slider.min = 0
                                            slider.max = 1000
                                            slider.step = 10
                                            slider.value = 100

                                            let gramText = document.createElement("span")
                                            gramText.textContent = "100g"
                                            
                                            slider.addEventListener("input", function(){

                                                // hämtar senaste tillagda ingrediensen gramvikt och sätter det till sliderns nya värde
                                                selectedIngredients[index].gram = slider.value 

                                                let newProtein = protein.varde * slider.value / 100
                                                proteinText.textContent = "Protein: " + newProtein.toFixed(1) + "g"

                                                let newCarbs = carbs.varde * slider.value / 100
                                                carbsText.textContent = "Kolhydrater: " + newCarbs.toFixed(1) + "g"

                                                let newFat = fat.varde * slider.value / 100
                                                fatText.textContent = "Fett: " + newFat.toFixed(1) + "g"

                                                let newCalories = calories.varde * slider.value / 100
                                                caloriesText.textContent = "Kalorier: " + newCalories.toFixed(1) + "kcal"

                                                gramText.textContent = slider.value + "g"

                                                updateTotal()
                                            })

                                            let deleteButton = document.createElement("button")
                                            deleteButton.type = "button"
                                            deleteButton.textContent = "Ta bort"
                                            deleteButton.addEventListener("click", function(){
                                                selectedIngredients.splice(index, 1)
                                                chosen.remove()
                                                updateTotal()
                                            })

                                            chosen.appendChild(gramText)
                                            chosen.appendChild(slider)
                                            chosen.append(deleteButton)
                                        }
                                    )
                            })
                            document.getElementById("ingredientList").appendChild(newListItem)
                            
                        }
                }
            )
        }
        else // rensar listan med råvaror ifall man suddar ut input
        {
            document.getElementById("ingredientList").innerHTML = ""
        } 
}

function updateTotal(){
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalCalories = 0

    for (let i = 0; i < selectedIngredients.length; i++)
        {
            totalProtein += selectedIngredients[i].protein * selectedIngredients[i].gram / 100
            totalCarbs += selectedIngredients[i].carbs * selectedIngredients[i].gram / 100
            totalFat += selectedIngredients[i].fat * selectedIngredients[i].gram / 100
            totalCalories += selectedIngredients[i].calories * selectedIngredients[i].gram / 100
        }

        document.getElementById("total-macros").innerHTML =
        "Totalt: " + totalCalories.toFixed(1) + "kcal " +
        "Protein: " + totalProtein.toFixed(1) + "g " +
        "Kolhydrater: " + totalCarbs.toFixed(1) + "g " +
        "Fett: " + totalFat.toFixed(1) + "g "

        document.getElementById("sidebar-right-goals").innerHTML =
        totalCalories.toFixed(1) + " / " + caloriesGoal + " kcal<br>" +
        totalProtein.toFixed(1) + " / " + proteinGoal + " g protein"
}

let goalButton = document.getElementById("goalButton")
goalButton.addEventListener("click", function(){
    proteinGoal = document.getElementById("proteinGoal").value
    caloriesGoal = document.getElementById("caloriesGoal").value

    updateTotal()
})