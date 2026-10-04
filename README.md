# Grocery List

A simple grocery list web app with a Node/Express backend, SQLite storage, and weekly email reminders.

## Features

- Add, edit, and delete grocery items
- Pin items as **recurring** so are not cleared each week.
- Weekly email sent with whatever is on your list currently.
- List automatically clears after being emailed to you, excluding recurring items.
- Data stored in a local SQLite database

## Tech stack

- **Backend:** Node.js, Express
- **Database:** SQLite 
- **Scheduling:** `node-cron`
- **Email:** [Resend](https://resend.com)
- **Frontend:** Plain HTML, CSS, and JavaScript

## Setup

### 1. Clone the repository

```
git clone https://github.com/dioncummings673-jpg/groceryapp
cd groceryapp
```

### 2. Install dependencies

```
npm install
```

### 3. Create a `.env` file

In the project root, create a file named `.env` containing your own [Resend](https://resend.com) API key:

```
RESEND_API_KEY=your_actual_key_here
```

This file is required for the email feature to work, and is intentionally excluded from the repository (see `.gitignore`) since it contains a secret key.

### 4. Run the server

```
node server.js
```

Then open [http://localhost:3000] in your browser.

## How the weekly email works

- Set your email address and preferred day in the Email Settings section of the app.
- A scheduled job checks once a day whether today matches your chosen day; if it does, it emails your current list.
- On Resend's free tier, emails can only be sent to the address you signed up with, unless you verify your own domain.

## Notes

- The SQLite database file (`groceries.db`) is created automatically on first run and is not included in the repository.
- This project was built as a learning exercise covering a full-stack CRUD app, scheduled background tasks, and third-party API integration.
- 05/10/2026 Changed logic from resetting list on the same day each week, to resetting list after sending an email.







