const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
var bodyParser = require('body-parser')

const app = express()
const port = 8000
app.use(bodyParser.urlencoded({ extended: false }))



// db.serialize(() => {
//     db.run("CREATE TABLE chemicals (c_id int NOT NULL,rfid VARCHAR(64),name VARCHAR(64),row INT(1),col INT(1),presence INT(1),PRIMARY KEY(c_id))");
//     db.run("CREATE TABLE selected_items (c_id int(3),PRIMARY KEY(c_id))");

//     const stmt = db.prepare("INSERT INTO chemicals (c_id,rfid,name,row,col,presence) VALUES (1,'rfidnacl','NaCl',1,1,1),(2,'rfidnaoh','NaOH',1,2,1)");
//     //for (let i = 0; i < 10; i++) {
//     //    stmt.run("Ipsum " + i);
//     //}
//     //stmt.finalize();

//     //db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
//       //  console.log(row.id + ": " + row.info);
//     //});
// });

// db.close();
// set the view engine to ejs
app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(cors()); 

app.get('/', (req, res) => {
  const sql = "SELECT * FROM chemicals;";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        res.render('index', { model: rows });
    });
})

app.get('/order', (req, res) => {
  var data= req.query;
  var size = Object.keys(data).length;
  if(size>0){
    for (const [key, value] of Object.entries(data)) {
      console.log(`${key}: ${value}`);
      const sql=`INSERT INTO selected_items VALUES (${key}); `;
      db.all(sql,[],(err,rows)=>{
        if(err){
          return console.error(err.message);
        }
      })
      const sql2=`UPDATE chemicals SET  presence = 0 WHERE c_id= ${key} ; `;
      db.all(sql2,[],(err,rows)=>{
        if(err){
          return console.error(err.message);
        }
        res.render('order');

      })


    }
  }
  console.log(size);
  
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})