const express = require('express')
const cors = require('cors')

const app = express()
const port = 4000

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