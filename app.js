const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('chemibot_db');
const app = express()
const port = 8000



db.serialize(() => {
    db.run("CREATE TABLE lorem (info TEXT)");

    const stmt = db.prepare("INSERT INTO lorem VALUES (?)");
    for (let i = 0; i < 10; i++) {
        stmt.run("Ipsum " + i);
    }
    stmt.finalize();

    db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
        console.log(row.id + ": " + row.info);
    });
});

db.close();
// set the view engine to ejs
app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(cors()); 

app.get('/', (req, res) => {
  res.render("index");
})

app.post('/', (req, res) => {
    res.send('Hello World POST!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})