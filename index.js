const express = require('express')
const cors = require('cors')

const app = express()
const port = 8000

app.use(cors()); 

app.get('/', (req, res) => {
  res.send('Hello World GET !')
})

app.post('/', (req, res) => {
    res.send('Hello World POST!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})