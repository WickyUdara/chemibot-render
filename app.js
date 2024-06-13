const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
const app = express();
const port = 8000;



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

app.use(express.json());

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
        

      })


    }
  }
  
  //console.log(size);
  res.render('order');
})

app.post('/order', (req, res) => {
  const {data} = req.body;
  if (data.length > 0) {
    const sqld = "DELETE FROM selected_items;";
    db.run(sqld, [], (err) => {
      if (err) {
        console.log(err);
      }
    })
  }
  const sql = "SELECT c.rfid, c.row, c.col FROM chemicals c, selected_items s WHERE c.c_id = s.c_id;";
  db.all(sql, [], (err, rows) => {
      if (err) {
          return console.error(err.message);
      }
      res.send(rows);
  });
})

app.post('/putchem', (req, res) => {
  const {rfid} = req.body;
  console.log(rfid);
  const sqlu = "UPDATE chemicals SET presence = 1 WHERE rfid = ?;"
  db.run(sqlu, [rfid], (err) => {
    if (err) {
      return console.error(err.message);
    }
  })
  const sql = "SELECT row, col FROM chemicals WHERE rfid = ?;"
  db.all(sql, [rfid], (err, rows) => {
    if (err) {
        return console.error(err.message);
    }
    res.send(rows);
  });
})

app.post('/insert', (req, res) => {
  const {c_id, rfid, name, row, col, presence} = req.body;
  
  const sql = "INSERT INTO chemicals(c_id, rfid, name, row, col, presence) VALUES (?, ?, ?, ?, ?, ?)";
  db.run(sql, [c_id, rfid, name, row, col, presence], (err) => {
    if (err) {
      res.send({message : "Data Not Added"});
      return console.log(err);
      
    }
    res.send({message : "Data Added"});
  })
  
})

app.post('/delete', (req, res) => {
  const {rfid} = req.body;
  
  const sql = "DELETE FROM chemicals WHERE rfid = ?";
  db.run(sql, [rfid], (err) => {
    if (err) {
      res.send({message : "Data Not Deleted"});
      return console.log(err);
      
    }
    res.send({message : "Data Deleted"});
  })
  
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})