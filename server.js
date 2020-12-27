if(process.env.NODE_ENV != 'production'){
    require('dotenv').config()
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

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie:{
      secure:true,
      maxAge:60000}
}))
app.use(passport.initialize())
app.use(passport.session())
var bodyParser = require('body-parser');
app.use(bodyParser.json());

const initializePassport = require('./passport-config')
const { ObjectId } = require('mongodb')
initializePassport(passport, username => users.find(user => user.username === username), id => users.find(user => user.id === id))



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
var selecteddoc = 0
var docrank = 0
var docs = []
var tempdoc = []
var criteria = {}
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
    logineduserid = req.user.id
    loginedusername = req.user.username
    console.log(logineduserid,loginedusername)
    
    const db = client.db(dbName);
    docs = await db.collection('restaurants').find().toArray()
    doccount = docs.length
    res.render('read.ejs', { username: loginedusername, doccount: doccount , docs: docs})
})

app.get ('/new', checkAuthenticated , (req,res) => {
    console.log(loginedusername)
    res.render('new.ejs')
})

app.post('/new' ,  checkAuthenticated, async (req, res, next) => {
    console.log(req.body)
    const db = client.db(dbName);
    db.collection('restaurants').insertOne({
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
    
    let id =req.params.id
   
    var idd = await db.collection('restaurants').find({_id: new mongodb.ObjectID(id)}).toArray()

    res.render('display.ejs', {tempdocs: idd})
})

app.get('/rate/:id', (req,res)=>{
    let id =req.params.id
    console.log('hi')
})

app.get('/change/:id' , async (req,res) => {
    let id =req.params.id
    const db = client.db(dbName);
    tempdoc = await db.collection('restaurants').find({_id: new mongodb.ObjectID(id)}).toArray()
    console.log(tempdoc)
    if(tempdoc[0].owner !== loginedusername){
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
    
    db.collection("restaurants").updateOne({_id: new mongodb.ObjectID(id)},myquery ,function(err, obj) {
        if (err) throw err;
        console.log("1 document changed");
    })
    res.redirect('/read')
})

app.get('/remove/:id' , async (req,res) => {
    let id =req.params.id
    const db = client.db(dbName);
    console.log(id)
    tempdoc = await db.collection('restaurants').find({_id: new mongodb.ObjectID(id)}).toArray()
    if(tempdoc[0].owner !== loginedusername){
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
