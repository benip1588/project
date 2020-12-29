if(process.env.NODE_ENV != 'production'){
    require('dotenv').config();
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const assert = require('assert');
var url = require('url')
const MongoClient = require('mongodb').MongoClient;
const dbName = 'test';
const uri = "";
const client = new MongoClient(uri, { useNewUrlParser: true }, { useUnifiedTopology: true });
var mongodb = require('mongodb');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser());
app.use(cookieParser());
app.use(flash())
app.use(session({
 key: 'hi',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie:{
      maxAge: 2678400000}
}))
app.use(passport.initialize())
app.use(passport.session())
const initializePassport = require('./passport-config')
initializePassport(passport, username => users.find(user => user.username === username), id => users.find(user => user.id === id))
const { ObjectId } = require('mongodb')



const users = [{
    id: '1608674093413',
    username: 'demo',
    password: null
},{
    id: '1608674065642',
    username: 'student',
    password: null
}]
var logineduserid = ''
var loginedusername = ''
var doccount = 1
const file = []
var docs = []
var tempdoc = []
var tempdocs = []


console.log(users)
console.log(file)


app.get('/' , (req,res) => {
    res.render('login.ejs')
})

app.get('/login', checkNotAuthenticated ,(req, res) => {
    res.render('login.ejs')
})


app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/read',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/read' ,  checkAuthenticated , async (req, res) => {
    logineduserid = req.user.id // check userid who logined
    loginedusername = req.user.username // check user who logined
    console.log(logineduserid,loginedusername)
    
    const db = client.db(dbName);
    docs = await db.collection('restaurants').find().toArray() // pass the mongodb document to the docs array
    doccount = docs.length // check how many document in mongodb
    res.render('read.ejs', { username: loginedusername, doccount: doccount , docs: docs})
})

app.get ('/new', checkAuthenticated , (req,res) => {
    console.log(loginedusername)
    res.render('new.ejs')
})

app.post('/new' ,  checkAuthenticated, async (req, res, next) => {
    console.log(req.body)
    const db = client.db(dbName);
    db.collection('restaurants').insertOne({ // to create and insert the user input to mongodb
        restaurant_id: Date.now().toString(),
        name: req.body.name,
        cuisine: req.body.cuisine,
        street: req.body.street,   
        building: req.body.building,
        zipcode: req.body.zipcode,
        lon: req.body.lon,
        lat: req.body.lat,
        owner: loginedusername
    })
    
    console.log(docs) 
    // console.log(docs)
    res.redirect('/read')
})

app.get('/display/:id' , async (req,res) => {
    const db = client.db(dbName);
    
    let id =req.params.id // check which file user selected by the id
   
    var idd = await db.collection('restaurants').find({_id: new mongodb.ObjectID(id)}).toArray() //find the id in the mongodb and pass to idd array

    res.render('display.ejs', {tempdocs: idd})
})

app.get('/rate/:id', (req,res)=>{
    let id =req.params.id
    console.log('hi')
})

app.get('/change/:id' , async (req,res) => {
    let id =req.params.id
    const db = client.db(dbName);
    tempdoc = await db.collection('restaurants').find({_id: new mongodb.ObjectID(id)}).toArray() //find the id in the mongodb and pass to tempdoc array
    console.log(tempdoc)
    if(tempdoc[0].owner !== loginedusername){ //check the logined user is equal to the document owner
        res.redirect('/read')
        console.log("You are not the owner")
    }
    else{
        res.render('change.ejs', {docs:tempdoc})
    }
    //res.render('change.ejs', {docs:tempdoc})
})

app.post('/change/:id', (req,res) => {
    let id =req.params.id
    const db = client.db(dbName);
    var myquery = {$set : {
        name: req.body.name,
        cuisine: req.body.cuisine,
        street: req.body.street,   
        building: req.body.building,
        zipcode: req.body.zipcode,
        lon: req.body.lon,
        lat: req.body.lat
    } }
    console.log(tempdoc)
    
    db.collection("restaurants").updateOne({_id: new mongodb.ObjectID(id)},myquery ,function(err, obj) { //update the document in mongodb
        if (err) throw err;
        console.log("1 document changed");
    })
    res.redirect('/read')
})

app.get('/remove/:id' , async (req,res) => {
    let id =req.params.id
    const db = client.db(dbName);
    console.log(id)
    tempdoc = await db.collection('restaurants').find({_id: new mongodb.ObjectID(id)}).toArray()//find the id in the mongodb and pass to tempdoc array
    if(tempdoc[0].owner !== loginedusername){//check the logined user is equal to the document owner
        res.redirect('/read')
        console.log("You are not the owner")
    }
    else{
        db.collection("restaurants").deleteOne({_id: new mongodb.ObjectID(id)}, function(err, obj) {
            if (err) throw err;
            console.log("1 document deleted");
            res.redirect('/read')
        })
    }
    //res.redirect('/read')
})

app.get('/api/restaurant/name/:name', (req,res) => {
    let name = req.params.name
    console.log(name)
    var result = {};
    result['name'] = req.fields.name;
    res.status(200).json(result).end();
    res.render('change.ejs', {docs:tempdoc})
});

app.get('/api/restaurant/borough/:borough', (req,res) => {
    var result = {};
    result['borough'] = Math.pow(req.params.length,2);
    res.status(200).json(result).end();
});

app.get('/api/restaurant/cuisine/:cuisine', (req,res) => {
    var result = {};
    result['cuisine'] = Math.pow(req.params.length,2);
    res.status(200).json(result).end();
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/login')
}
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/login')
    }
    next()
}

const findDocument = (db, file, callback) => {
    var cursor = db.collection('restaurants').find();
    //docs = []
   // cursor.toArray((err,docss) => {
   //  assert.equal(err,null);
   //  callback(docss);
   //  docs.push.apply(docs,docss)
     doccount = docs.length
  //  })
}

function display (db, id, callback)  {
    
    var cursor = db.collection('restaurants').find(id)
    
    cursor.toArray((err,docss) => {
        assert.equal(err,null);
        callback(docss);
        tempdocs.push.apply(tempdocs,docss)        
       })
    
}

client.connect((err) => {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    findDocument(db, file, () => {
        //client.close();
        console.log("found all file ");
    })
    
});


process.env.PORT || app.listen(8080)
