const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const user = require('./routes/app');
const session = require('express-session');
const mongostore = require('connect-mongo');

mongoose.connect('mongodb://localhost:27017/URLShortener');

app.use(session({
    secret : "foo",
    resave : false,
    saveUninitialized : true,
    store : mongostore.create({mongoUrl : 'mongodb://localhost:27017/URLShortener'})
}))

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use('', user);

app.listen(4000, () => {
    console.log("URL Shortener app listening at port 4000",);
})
