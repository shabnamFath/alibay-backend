const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const url = "mongodb://admin:chehade7@ds151137.mlab.com:51137/mydatabase";
const databaseName = "mydatabase";
const fs = require("fs")
app.use(bodyParser.raw({ type: "*/*", limit:'50mb' }));

let sessions = {} // associates a session id to a username

let db; //this is the database object
let usersdb;
let itemsdb;
let reviewsdb;

//ID generator
let genID = function () {
    return Math.floor(Math.random() * 100000000000)
}

MongoClient.connect(url, {
    useNewUrlParser: true
}, function (err, database) {
    
    if (err) throw err;
    db = database.db(databaseName);
    usersdb = db.collection("users")
    itemsdb = db.collection("items")
    reviewsdb = db.collection("reviews")
    app.listen(3091, function () { console.log("Server started on port 3091") })
});

//signup endpoint
app.post('/signup', function (req, res) {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password


    usersdb.findOne({ username: username }, function (err, result) {
        if (result) {
            let response = {
                status: false,
            
            }  
            res.send(JSON.stringify( response ))
            return;
        }
        else {
            let userID = genID()
            let user = { userID: userID, username: username, password: password, reviews: [] }
            usersdb.insertOne(user, (err, result) => {
                let response = {
                    status: true,
                
                }  
                res.send(JSON.stringify( response ))
            })
        }
    })
})

//login endpoint
app.post('/login', function (req, res) {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password
    usersdb.findOne({ username: username }, function (err, result) {
        if (!result) {
            let response = {
                status: false,
            }
            res.send(response)
            return;
        }
        else {
            if (result.password === password) {
                let sessionID = genID()
        
                sessions[sessionID] = username
                res.set('Set-Cookie', sessionID)
                let response = {
                    sessionID: sessionID,
                    status: true,
                }
            res.send(JSON.stringify( response ))
        }}
    })
})
//check for Cookie
app.get('/checkCookie',function(req,res){
    let sessionID= req.headers.cookie
    if(sessions[sessionID]){
        res.send(JSON.stringify({success: true}))
}else{
    res.send(JSON.stringify({success: false}))
}
})


// Add Item 
app.post('/addItem', function (req, res) {
    let parsed = JSON.parse(req.body)
    let itemPrice = parsed.price
    let itemName = parsed.name
    let imageName = parsed.filename
    let description = parsed.description
    let itemID = genID()
    let itemDescriptions = {}
    let sessionID = parsed.sessionID
    let username = parsed.username
    let category = parsed.category
    itemDescriptions[itemID] = {
        name: itemName,
        image: imageName,
        description: description,
        price: itemPrice, 
        itemID: itemID,
        sessionID: sessionID,
        username: username,
        category: category
    }
    itemsdb.insertOne(itemDescriptions[itemID], (err, result) => {
        if (err) throw err;
        console.log(result)
        let response = {
            status: true
        }
        res.send(JSON.stringify( response ))
    })
})

// Add Image 
// need to write the image to a dictionary using the image name - i think(use fs.)
app.use(express.static(__dirname+'/images'))

app.post('/pics', (req, res) => {
    var extension = req.query.ext.split('.').pop();
    var randomString = '' +  Math.floor(Math.random() * 10000000)
    var randomFilename = randomString + '.' + extension
    fs.writeFileSync(__dirname+'/images/' +  randomFilename, req.body);
    res.send(randomFilename)
})

// Get All Items 
app.get('/getAllItems', function (req, res) {
    itemsdb.find({}).toArray((err, result) => {
        if (err) throw err;
        console.log(result)
        let response = {
            status: true,
            result: result
        }
        res.send(JSON.stringify( response ))
    })
})

// View all Item Details
app.post('/itemDetails', function (req, res) {
    let parsed = JSON.parse(req.body)
    let itemID = parsed.itemID
    // let itemId = result.insertedId.toString()
    let itemDetails = {
       itemID: parseInt(itemID)
   }
    itemsdb.findOne(itemDetails,(err, result) => {
        if (err) throw err;
        let response = {
            status: true,
            result: result
        }
        res.send(JSON.stringify( response ))
    })
})

//Seller Details and list of Reviews
app.get('/sellerInformation', function (req, res) {
    let parsed = JSON.parse(req.body)
    let sessionID= req.headers.cookie
    let userID = userID
    let sellerInformation = {}
    sellerInformation[sessionID] = {
        userID: userID,
        review: review
    }
    usersdb.findOne(itemDetails,(err, result) => {
        if (err) throw err;
        console.log(result)
        let response = {
            status: true,
          
        }
        res.send(JSON.stringify( response ))
    })
})

//Add a Review
app.post('/addReview', function (req, res) {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let review = parsed.review
    
    usersdb.update({username:username},{$push:{reviews:parsed.review}}, (err, result) => {
        if (err) throw err;
        console.log(result)
        let response = {
            status: true,
            reviews: result
        }
    res.send(JSON.stringify( response ))
})
})

//Get all Reviews
app.post('/getAllReviews', function (req, res) {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    // reviews = reviews.slice(-5)
    usersdb.findOne({username:username},(err, result) => {
            if (err) throw err;
            console.log(result)
            let response = {
                status: true,
                result: result.reviews
            }
            res.send(JSON.stringify( response ))
        })
    })

app.post('/search', function (req, res){
    let parsed = JSON.parse(req.body)
    let searchWord = parsed.query
    searchWord = searchWord.toLowerCase()
    itemsdb.find({}).toArray((err, result) => {
        if (err) throw err;
        let searchResults = result.filter(function (item){
            return item.description.toLowerCase().includes(searchWord)
        })
        res.send(JSON.stringify(searchResults))
    })
})


//Add to Cart
// app.post('/addToCart', function (req, res) {
//     let parsed = JSON.parse(req.body)
//     let itemPrice = parsed.price 
//     let itemName = parsed.name
//     let imageName = parsed.image
//     let itemDescriptions = {}
//     itemDescriptions[itemID] = {
//         name: itemName,
//         image: imageName,
//         price: itemPrice, 
//     }
//     itemsdb.insertOne(item, (err, result) => {
//         if (err) throw err;
//         console.log(result)
//         let response = {
//             status: true
//         }
//         res.send(JSON.stringify({ response }))
//     })
// })

//Pay Now
app.post('/payNow', function (req, res) {

})