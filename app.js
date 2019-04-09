//Require Module
const express = require('express');

const router = require('./routes/bulk_user_upload');

const bodyParser = require('body-parser');




//Ininitialize express
const app = express();

//midleware
app.use(bodyParser.json());

app.use(router)

app.listen(8000, ()=>{
  console.log('listen port 8000')
})