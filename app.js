const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
const Schema = mongoose.Schema;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/languageDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const snippetSchema = Schema({
    title: String,
    description: String
});

const languageSchema = Schema({
    name: String,
    snippets: [snippetSchema]
});


const Snippet = mongoose.model('Snippet', snippetSchema);
const Language = mongoose.model('Language', languageSchema);

const python = new Language({
    _id: new mongoose.Types.ObjectId(),
    name: 'Python'
    });

const javascript = new Language({
    _id: new mongoose.Types.ObjectId(),
    name: 'JavaScript'
    });

app.post('/addlang', function (req,res) { 
    let langName = req.body.langName;
    const newLang = new Language({
        name: langName,
    });
    newLang.save(function (err) { 
        if(err){console.log(err);
        } else {
            res.redirect('/' + langName);
        }
    });
});

app.get('/', function (req,res) { 
    res.redirect('/Python');
 });

app.get('/home', function (req,res) { 
    res.redirect('/')
 });

app.get('/:langName?', function (req,res) {

    let langName = req.params.langName;
    let path = "snippets";
    let defaultLang = python;
    let passedLang = defaultLang;
    
    Language.find({}, function (err, languages) { 
        if(!err){
            if (languages === undefined || languages.length == 0) {
                

                Language.insertMany([python, javascript], function (err, docs) { 
                    if(!err){
                        console.log('Successfuly added base languages');
                    } else{
                        console.log(err);
                    }
                 });
             
                res.redirect('/');

            } else {

                Language.find({name: langName}, function (err, lang){

                    if(err){console.log(err);
                    } else{
                        if(lang.length===0){
                            res.render("page404");
                            // res.render(path, {langs:languages, active: passedLang, snippets:passedLang.snippets});
                        } else{
                            passedLang = lang[0];
                            if (passedLang.snippets === undefined || passedLang.snippets.length == 0){
                                path = "empty";
                            }
                            res.render(path, {langs:languages, active: lang[0], snippets:passedLang.snippets, tagline:'You have not added any snippets here'});
                        }
                        
                    }
                    
                });
                
            }
            
        }
     });
    
 });

app.post('/:langName?', function (req,res) { 

    let langId = req.body.submit;
    let title = req.body.enteredTitle;
    let desc = req.body.enteredDescription;

    if(!desc){
        desc = 'No description available';
    }

    const newSnippet = new Snippet({
        title: title,
        description: desc
    });

    Language.findByIdAndUpdate(langId,
        {$push: {snippets: newSnippet}},
        function (err, lang) {
            if(err){console.log(err);
            } else{
                console.log('Successfully added the snippet');
                // res.redirect('/' + req.params.langName);
            }
        
     });
     res.redirect('/' + req.params.langName);

 });


app.get('/:langName?/snippets/:snippetId', function (req,res) { 
    let langName = req.params.langName;
    let snippetId = _.trim(req.params.snippetId);
    
    Language.find({}, function (err, languages) { 
        if(!err){
            Language.findOne({name:langName}, function (err, lang) {
                if(!err){
                    let snippet = lang.snippets.id(snippetId);
                    res.render("detail", {snippet:snippet,langs:languages, active: lang});
                }
                
             });
        }
     });
    
 });

app.get('/delete/:langName/:snippetId', function (req,res) { 
    let langName = req.params.langName;
    let snippetId = _.trim(req.params.snippetId);
    Language.update({name:langName}, {"$pull":{"snippets":{ _id:snippetId}}},{ safe: true}, function (err,data) { 
        if (!err) {
            console.log('Deleted');
            res.redirect('/'+langName);
        }
     });
     
 });

app.post('/search/:langName', function (req,res) { 
    let lang = req.params.langName;
    let path = 'snippets';
    let userText = _.trim(req.body.inputText).toLowerCase();
    Language.findOne({name:lang}, function (err,data) { 
        if(!err){
            let searchResults = [];
            data.snippets.forEach(snippet => {
                const snipTitle = snippet.title.toLowerCase();
                const isPresent = snipTitle.includes(userText);
                if (isPresent) {
                    searchResults.push(snippet);
                }
            });
            if(searchResults.length===0){
                path = 'empty';
            }
            Language.find({},function (err,alllangs) { 
                if(!err){
                    res.render(path, {langs:alllangs, active: {name:lang}, snippets:searchResults, tagline:'No snippets by that name'});
                }
             });
            
        } else{
            console.log(err);
        }
     });
 });

app.listen(3000, function () { 
    console.log('Listening on port 3000');
 });
