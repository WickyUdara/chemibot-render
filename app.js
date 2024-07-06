const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.sqlite");
const app = express();
const bcrypt = require("bcrypt");
const session = require("express-session");
app.use(express.urlencoded({ extended: true }));

const port = 8000;

//db.serialize(() => {
//  db.run("CREATE TABLE chemicals (c_id INT NOT NULL, rfid VARCHAR(64), name VARCHAR(64), mfd TEXT, exd TEXT, row INT, col INT, presence INT, PRIMARY KEY(c_id))");
//  db.run("CREATE TABLE selected_items (c_id INT, PRIMARY KEY(c_id))");
//  db.run("CREATE TABLE IF NOT EXISTS statistics (c_id INT, count INT, PRIMARY KEY(c_id), FOREIGN KEY(c_id) REFERENCES chemicals(c_id))");
//  db.run("ALTER TABLE statistics ADD COLUMN borrowed_at TEXT");
//  db.run("ALTER TABLE statistics ADD COLUMN count INT");

// const stmt = db.prepare("INSERT INTO chemicals (c_id, rfid, name, mfd, exd, row, col, presence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

//  stmt.run(1, 'rfidnacl', 'NaCl', '2024-05-26', '2024-05-26', 1, 1, 1);
//  stmt.run(2, 'rfidnaoh', 'NaOH', '2024-05-26', '2024-05-26', 1, 2, 1);
//  stmt.finalize();

// Ensure the 'lorem' table exists if you want to query from it
// db.run("CREATE TABLE lorem (info TEXT)");

//  db.each("SELECT c_id AS id, name FROM chemicals", (err, row) => {
//      if (err) {
//          console.error(err);
//      } else {
//          console.log(row.id + ": " + row.name);
//      }
//  });
//});

//db.serialize(() => {
//  db.run(`CREATE TABLE users (
//    id INTEGER PRIMARY KEY AUTOINCREMENT,
//    username TEXT UNIQUE,
//    password TEXT,
//    isAdmin BOOLEAN
//  )`);

// Create a default admin user
//  const stmt = db.prepare(`INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)`);
//  const saltRounds = 10;
//  const adminPassword = 'admin'; // Change this to a more secure password
//  bcrypt.hash(adminPassword, saltRounds, (err, hash) => {
//   if (err) throw err;
//    stmt.run('admin', hash, true); // Provide the values for username, password, and isAdmin
//    stmt.finalize();
//  });
// Create a  user
//  const stmt2 = db.prepare(`INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)`);

//  const userPassword = 'lab-user'; // Change this to a more secure password
//  bcrypt.hash(userPassword, saltRounds, (err, hash) => {
//    if (err) throw err;
//    stmt2.run('lab-user', hash, false); // Provide the values for username, password, and isAdmin
//    stmt2.finalize();
//  });
//});
// set the view engine to ejs
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(express.json());

app.use(cors());

app.use((req, res, next) => {
  res.locals.currentRoute = req.path;
  next();
});
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/");
  }
}
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.status(403).send("Forbidden");
  }
}
app.get("/", (req, res) => {
  res.render("login");
});
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) throw err;

    if (user) {
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
          req.session.user = {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin,
          };
          console.log(user.isAdmin);
          if (user.isAdmin == 1) {
            res.redirect("/admin-dashboard");
          } else {
            res.redirect("/dashboard");
          }
        } else {
          res.send("Invalid username or password");
        }
      });
    } else {
      res.send("Invalid username or password");
    }
  });
});

app.get("/dashboard", isAuthenticated, (req, res) => {
  const sql = "SELECT * FROM chemicals WHERE c_id != 0;";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("index", { model: rows, username: req.session.user.username ,user: req.session.user});
  });
});
app.get("/admin-dashboard", isAuthenticated, isAdmin, (req, res) => {
  const sql = "SELECT * FROM chemicals WHERE c_id != 0;";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("admin", { model: rows, username: req.session.user.username,user: req.session.user });
  });
});
app.get("/admin-stat", isAuthenticated, isAdmin, (req, res) => {
  const sql = `SELECT c.name, s.count,s.borrowed_at FROM statistics s
               JOIN chemicals c ON s.c_id = c.c_id`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render('stat', { user: req.session.user, statistics: rows });
  });
});
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
app.get("/order", isAuthenticated, (req, res) => {
  var data = req.query;
  var size = Object.keys(data).length;
  if (size > 0) {
    for (const [key, value] of Object.entries(data)) {
      console.log(`${key}: ${value}`);
      const sql = `INSERT INTO selected_items VALUES (${key}); `;
      db.all(sql, [], (err, rows) => {
        if (err) {
          return console.error(err.message);
        }
      })
      const sql2=`UPDATE chemicals SET presence = 0 WHERE c_id= ${key} ; `;
      db.all(sql2,[],(err,rows)=>{
        if(err){
          return console.error(err.message);
        }
      })
      const sql3 = `INSERT OR IGNORE INTO statistics (c_id, count, borrowed_at) VALUES (${key}, 1, ?)`;
              const currentDateTime = new Date().toISOString();
              db.run(sql3, [ currentDateTime], (err) => {
                if (err) {
                  return reject(err);
                }

                // Update statistics table to increment count and set borrowed_at
                const sql4 = `UPDATE statistics SET borrowed_at = ?,count = count + 1  WHERE c_id = ${key}`;
                db.run(sql4, [currentDateTime], (err) => {
                  if (err) {
                    return reject(err);
                  }

                  
                });
              });
    }
  }

  //console.log(size);
  res.render('order',{user:req.session.user});
})




app.post("/order", (req, res) => {
  const { data } = req.body;
  if (data.length > 0) {
    const sqld = "DELETE FROM selected_items;";
    db.run(sqld, [], (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
  const sql =
    `SELECT c.rfid, c.row, c.col 
    FROM chemicals c, selected_items s 
    WHERE c.c_id = s.c_id
    ORDER BY 
      CASE c.row
        WHEN 2 THEN 1
        WHEN 3 THEN 2
        WHEN 1 THEN 3
      END DESC,
      CASE c.col
        WHEN 3 THEN 1
        WHEN 2 THEN 2
        WHEN 4 THEN 3
        WHEN 1 THEN 4
        WHEN 5 THEN 5
      END DESC, 
      c.col`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.send(rows);
  });
})

app.post('/update-chemical/:id', (req, res) => {
  const id = req.params.id;
  const { exd, mfd, rfid, name } = req.body;

  const sql = `UPDATE chemicals SET exd = ?, mfd = ?, rfid = ?, name= ? WHERE c_id = ?`;
  const params = [exd, mfd, rfid,name, id];

  db.run(sql, params, function(err) {
    if (err) {
      console.error(err.message);
      res.json({ success: false });
      return;
    }
    res.json({ success: true });
  });
});

app.get("/putchem", isAuthenticated, (req, res) => {
  const sql = `INSERT INTO selected_items VALUES (0);`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
  });

  res.render("putchem", { user: req.session.user });
});

app.post("/putchem", (req, res) => {
  const { data } = req.body;
  console.log(data);
  const sqlu = "UPDATE chemicals SET presence = 1 WHERE rfid = ?;";
  db.run(sqlu, [data], (err) => {
    if (err) {
      return console.error(err.message);
    }
  });
  res.send({"Confirmation" : data});
  // const sql = "SELECT row, col FROM chemicals WHERE rfid = ?;";
  // db.all(sql, [data], (err, rows) => {
  //   if (err) {
  //     return console.error(err.message);
  //   }
  //   res.send(rows);
  // });
});

app.post("/allchems", (req, res) => {
  const sql = "SELECT rfid, row, col FROM chemicals WHERE c_id != 0;";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.send(rows);
  });
});

app.post("/insert", (req, res) => {
  const { c_id, rfid, name, row, col, presence } = req.body;

  const sql =
    "INSERT INTO chemicals(c_id, rfid, name, row, col, presence) VALUES (?, ?, ?, ?, ?, ?)";
  db.run(sql, [c_id, rfid, name, row, col, presence], (err) => {
    if (err) {
      res.send({ message: "Data Not Added" });
      return console.log(err);
    }
    res.send({ message: "Data Added" });
  });
});

app.post("/delete", (req, res) => {
  const { rfid } = req.body;

  const sql = "DELETE FROM chemicals WHERE rfid = ?";
  db.run(sql, [rfid], (err) => {
    if (err) {
      res.send({ message: "Data Not Deleted" });
      return console.log(err);
    }
    res.send({ message: "Data Deleted" });
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
