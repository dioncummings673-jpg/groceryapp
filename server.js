const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

require('dotenv').config();
const {Resend} = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const cron = require('node-cron');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const database = require('better-sqlite3');
const { type } = require('os');

//Sets up DB with necessary tables to store data
const db = new database(path.join(__dirname, 'groceries.db'));
db.exec(`
    CREATE TABLE IF NOT EXISTS groceries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        recurring INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
`);

//Allowing access and changing of settings (date, emails etc).
function getSettings(key,fallback){
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    if(row){
        return row.value
    }else{
        return fallback;
    }
}
//Ensuring settings are put into DB correctly.
function setSettings(key,value){
    db.prepare(`INSERT INTO settings (key,value) VALUES (?,?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key,value);
}
//Fetching settings on request
app.get('/api/settings',(req,res)=>{
    res.json({
        email:getSettings('notifyEmail', ''),
        day: getSettings('notifyDay', 'Sunday')
    })
})
//Altering settings on request
app.post('/api/settings', (req,res) =>{
    let email;
        if(typeof req.body.email === 'string'){
            email =  req.body.email.trim();
        } else{ 
            email = '';
        } 
    let day;
        if(typeof req.body.day === 'string'){
        day = req.body.day.trim();
        } else {
            day = '';
    }
    const validListOfDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if(!validListOfDays.includes(day)){
        return res.status(400).json({error: 'Not a day'});
    }
    setSettings('notifyEmail', email);
    setSettings('notifyDay', day);
    res.json({email,day});

})

//To allow index to request the list to display
app.get('/api/groceries', (req,res) =>{
    const rows = db.prepare('SELECT id, text, recurring FROM groceries').all();
    res.json(rows);

})

//Allows addition of items to the database
app.post('/api/groceries', (req,res) =>{
    const text = req.body.text;
    const info = db.prepare('INSERT INTO groceries (text) VALUES (?)').run(text);
    res.status(201).json({id:info.lastInsertRowid, text, recurring: false});
})

//Allows deletion of items from the database
app.delete('/api/groceries/:id', (req, res)=>{
    const id = Number(req.params.id);
    const info = db.prepare('DELETE FROM groceries WHERE id = ?').run(id);
    if(info.changes === 0){
        return res.status(404).json({error: 'Not Found'})
    }
    res.status(204).end();

})

//Allows editing of grocery items in the database.
app.patch('/api/groceries/:id', (req,res) =>{
    const id =Number(req.params.id);
    const existingGrocery = db.prepare('SELECT id, text, recurring FROM groceries WHERE id =?').get(id);

    if(!existingGrocery){
        return res.status(404).json({error: 'Not found'});
    }
    let text;
        if(typeof req.body.text === 'string'){
            text = req.body.text.trim();
        }
        else {
            text = existingGrocery.text;
        }
    let recurring;
        if(typeof req.body.recurring === 'boolean'){
            if(req.body.recurring){
                recurring = 1;
            }
            else {
                recurring = 0;
            }
        } else{
            recurring = existingGrocery.recurring;
        }   
    
    db.prepare('UPDATE groceries SET text = ?, recurring = ? WHERE id = ?').run(text,recurring,id);

    res.json({id,text,recurring: Boolean(recurring)});


})


//Function for sending the list to my email, then deleting non-recurring items on the list
async function sendGroceryEmail(){
    const email = getSettings('notifyEmail', '');
    if(!email){
        console.log('No email- nothing sent');
        return;
    }
    const rows = db.prepare('SELECT text FROM groceries ORDER BY id').all();

    let listHtml;
    if(rows.length === 0){
        listHtml = '<p> Your list is empty.</p>'
    } else {
        const items = rows.map(row => `<li>${row.text}</li>`).join('');
        listHtml= `<ul>${items}</ul>`;
    }
    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Grocery list',
        html: listHtml
    });
     db.prepare('DELETE FROM groceries WHERE recurring = 0').run();
}

//Scheduler to allow sending of email on day of choosing
cron.schedule('0 8 * * *', () => {
  const today = new Date().toLocaleDateString('en-US', {weekday: 'long'});
  const emailDay = getSettings('notifyDay', 'Sunday');
  if(today === emailDay){
    sendGroceryEmail();
  }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});




