loadPart("site-header", "header.html")
loadPart("site-footer", "footer.html")

function loadPart(id, file) {
    fetch(file)
    .then(function(response) {
        return response.text()
    })
    .then(function(html) {
        document.getElementById(id).innerHTML = html
    })
}