/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Savan Chauhan Student ID: 134823210 Date: 2023-06-06
*
*  Cyclic Web App URL: ________________________________________________________
*
*  GitHub Repository URL: https://github.com/SavanKumarChauhan/web322-app.git
*
********************************************************************************/ 


var express = require("express");
var app = express();
var path = require("path");
//const blog = require("/blog-service");

var HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.use(express.static('public'));

// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function(req,res){
    res.sendFile(path.join(__dirname, "/views/about.html"))
    
});

app.get("/",function(req,res){
    res.redirect("/about");
})

app.get("/blog",function(req,res){
    res.send("TODO: get all posts who have published==true");
})
 app.get("/posts",(req,res)=>{
    res.sendFile(path.join(__dirname, "/data/posts.json"))
 });

 app.get("/Categories",(req,res)=>{
    res.sendFile(path.join(__dirname, "/data/categories.json"))
 });

 app.use((req, res) => {
    res.status(404).send("Error:404:Page Not Found");
  })


// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);

