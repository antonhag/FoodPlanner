const url = "https://dataportal.livsmedelsverket.se/livsmedel"

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
    ingredients += "<button type='submit'>Lägg till ingrediens"
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
                    return item.namn.includes(ingredientName)
                })

                document.getElementById("ingredientList").innerHTML = ""                                                  

                for (let i = 0; i < result.length; i++)
                    {
                        let newListItem = document.createElement("li")
                        newListItem.textContent = result[i].namn
                        newListItem.addEventListener("click", function() {
                            alert(result[i].namn)
                        })
                        document.getElementById("ingredientList").appendChild(newListItem)
                        
                    }

                console.log(result)
            }
        )
}