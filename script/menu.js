buildMenu()

function buildMenu()
{
    let links = [                                                                                         
        ["Matplaneraren", "index.html"],
        ["Populära rätter", "populardishes.html"]                                                                
    ]    

    const menu = document.getElementById("menu")
    if (!menu) return

    menu.innerHTML = ""

    for (let i = 0; i < links.length; i ++)
    {
        let listItem = document.createElement("li")
        let link = document.createElement("a")
        link.href = links[i][1]
        let text = document.createTextNode(links[i][0])

        link.appendChild(text)
        listItem.appendChild(link)
        menu.appendChild(listItem)
    }
    
}
