const textarea = document.querySelector('textarea');
const addButton = document.getElementById('addButton');
const groceryContainer = document.querySelector('.groceryContainer');
const settingsForm = document.getElementById('settingsForm');
const emailInput = document.getElementById('emailInput');
const dayInput = document.getElementById('dayInput');
let groceryList = []
let editingId = null;

//Creates each element on the page based on information received from the database.
function renderGroceries(){
    groceryContainer.innerHTML = '';

    groceryList.forEach(item =>{
        const card = document.createElement('div');
        card.className = 'grocery';

        const text = document.createElement ('p');
        text.textContent = item.text;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'iconButton';
        deleteButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        deleteButton.addEventListener('click', () => deleteGroceries(item.id));

        const editButton = document.createElement('button');
        editButton.className = 'iconButton';
        editButton.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
        editButton.addEventListener('click', () => editGroceries(item));

        const reccuringButton = document.createElement('button');
        if(item.recurring === 0){
            reccuringButton.className = 'iconButton';
        } else {
            reccuringButton.className = 'iconButton active';
        } 
        reccuringButton.innerHTML = '<i class = "fa-solid fa-thumbtack"></i>';
        reccuringButton.addEventListener('click', () => toggleRecurring(item));


        const buttonContainer = document.createElement('div');
        buttonContainer.appendChild(deleteButton);
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(reccuringButton);

        card.appendChild(text);
        card.appendChild(buttonContainer);
        groceryContainer.appendChild(card);

    })
}

//Add to list
async function addGroceryToList(){
    const text = textarea.value.trim();
    if (!text){
        return;
    }
    if(editingId === null){
    await fetch('/api/groceries',{
        method: 'POST',
        headers : {'Content-Type': 'application/json'},
        body: JSON.stringify({text})
    });
    }else {
        await fetch(`/api/groceries/${editingId}`,{
            method : 'PATCH',
            headers : {'Content-Type' : 'application/json'},
            body: JSON.stringify({text})
        });
        editingId = null;
    }
    textarea.value = '';
    await loadGroceries();

}
//Delete from list
async function deleteGroceries(id){
    await fetch(`/api/groceries/${id}`, {method: 'DELETE'});
    await loadGroceries();
}

//Edit list
function editGroceries(item){
    editingId = item.id;
    textarea.value = item.text;
    textarea.focus();
}


//For any items the user wishes to keep week to week.
async function toggleRecurring(item){
    await fetch(`/api/groceries/${item.id}`,{
        method: 'PATCH',
        headers: {'Content-TYPE': 'application/json'},
        body: JSON.stringify({recurring: !item.recurring})
    });
    await loadGroceries();
}
//Loads DB on page load and renders on screen afterward.
async function loadGroceries() {
    const response = await fetch('/api/groceries');
    groceryList = await response.json();
    renderGroceries();
}
//Loads settings from DB, if there are any.
async function loadSettings(){
    const response = await fetch('/api/settings');
    const settings = await response.json();
    emailInput.value = settings.email;
    dayInput.value = settings.day;
}
//Saves whatever is in the settings form to the DB when the button is pressed, then alerts the user.
async function saveSettings(event){
    event.preventDefault();

    await fetch('/api/settings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            email: emailInput.value,
            day: dayInput.value
        })
    })
    alert('Settings saved');
}



addButton.addEventListener('click', addGroceryToList);
settingsForm.addEventListener('submit', saveSettings);
loadGroceries();
loadSettings();




























