
var express = require("express");
var passport = require('passport');

var bcrypt = require('bcryptjs');
console.log("Routes loaded!");


var path = require("path");
var db = require("../models");
var nodemailer = require("nodemailer");
var bcrypt = require('bcryptjs');
const goodreads = require('goodreads');
var randomstring = require("randomstring");

var db = require("../models");

// DETERMINE CONNECTION
// =============================================================|
if (!process.env.PORT) {
var keys = require("../app/config/keys.js");
} else {
  console.log("Heroku connection");
  var keys = process.env
}

var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
      user: keys.user,
      pass: keys.pass
    }
});
 
module.exports = function(app) {


      app.post("/api/new_member", function(req, res) {
        var hashedPassword;
        var salt = bcrypt.genSaltSync(10);
        hashedPassword = bcrypt.hashSync(req.body.password, salt);
        db.Member.findOne({
            where:{
                email:req.body.email
            }
        }).then(function(data){
            console.log(data);
            if(data){
                var member_id = data.dataValues.id;
                // console.log("DATA VALUES:" + data.dataValues.id);
                // console.log("MEMBER ID: " + member_id);
                // db.Member.findOne({
                //     where:{
                //         id: member_id
                //     }
                // }).then(function(data){
                //     console.log(data);
                db.Member.update({
                    phone: req.body.phone,
                    password: hashedPassword,
                    goodreads_url: req.body.goodreads_url,
                    favorite_genre: req.body.favorite_genre,
                    favorite_book: req.body.favorite_book
                }, {
                    where: {
                        id: member_id
                    }
                }).then(function(data) {
                    res.redirect("/login");
                    console.log("it didn't redirect");
                  });
                // });
            };
        });
    });


  // INITIALIZE PASSPORT STRATEGY
  app.post('/login',
    passport.authenticate('local', 
        {failureRedirect: '/',
        failureFlash: true}),
    function(req, res) {
        db.Member.findOne({
        where: {
            id: req.user.id
        },
    }).then(function(result) {
        var book_associate=JSON.parse(JSON.stringify(result)).current_book
        console.log("book id" + book_associate);
        if (book_associate===0){
          res.redirect("/vote")
        }else{
          res.redirect("/profile")
        }
    });
  });

  // GET DATA OF THE MEMBER WHO IS LOGGED IN
  app.get("/request",
    require('connect-ensure-login').ensureLoggedIn('/login'),
    function(req,res){
      console.log("Print user name: " + req.user.first_name);
      res.json(req.user)
  });

  app.get("/comment",require('connect-ensure-login').ensureLoggedIn('/login'),
    function(req,res){
      db.Discussion.findAll({
        where:{
          chapter: {
            $gt:req.body.chapter
          }
        },
        limit:10
      }).then(function(data){
        var comment=[];
        for(key in data){
          comment.push({
            comment:data[key].dataValues.comment,
            book:data[Key].dataValue.title,
            sender:data[key.dataValues.first_name]
          })
        }
        res.json(comment);
      })
    });

  app.post("/comment",require('connect-ensure-login').ensureLoggedIn('/login'),
    function(req,res){
      db.Discussion.insert({
        chapter:user.chapter,
        comment:req.body.comment,
        email:user.email
      }).then(function(result){
        console.log("comment added in db")
      })
    });

  // app.get("/api/members/:email", function(req, res) {
  //   db.Member.findOne({
  //       where: {
  //           email: req.params.email
  //       },
  //   }).then(function(result) {
  //       var book_associate=JSON.parse(JSON.stringify(result)).current_book
  //       console.log("book id" + book_associate);
  //       if (book_associate===0){
  //         res.json(false)
  //       }else{
  //         res.json(true)
  //       }
  //   });
  // });

  // CHECK TO SEE IF MEMBER IS READING A BOOK
  app.get("/api/members/:email", function(req, res) {
    db.Member.findOne({
        where: {
            email: req.params.email
        },
    }).then(function(result) {
        var book_associate=JSON.parse(JSON.stringify(result)).current_book
        console.log("book id" + book_associate);
        if (book_associate===0){
          res.json(false)
        }else{
          res.json(true)
        }
    });
  });

  // UPDATE THE MEMBER DATABASE AT REGISTRATION
  // ADD: USER FEEDBACK IF BAD EMAIL, OR EMAIL ALREADY REGISTERED
  // app.post("/api/new_member", function(req, res) {
  //     var hashedPassword;
  //     var salt = bcrypt.genSaltSync(10);
  //     hashedPassword = bcrypt.hashSync(req.body.password, salt);
  //     db.Member.findOne({
  //       where:{
  //         email:req.body.email
  //       }
  //     }).then(function(data){
  //       console.log(data);
  //       if(data){
  //         var member_id = data.dataValues.id;
  //         db.Member.findOne({
  //           where:{
  //             id: member_id
  //           }
  //         }).then(function(data){
  //             console.log(data);
  //             db.Member.update({
  //                 phone: req.body.phone,
  //                 password: hashedPassword,
  //                 goodreads_url: req.body.goodreads_url,
  //                 favorite_genre: req.body.favorite_genre,
  //                 favorite_book: req.body.favorite_book
  //             }, {
  //               where: {
  //                 id: member_id
  //               }
  //             }).then(function() {
  //                 res.send(true);
  //             });
  //           });
  //         };
  //     });
  // });

  // REQUEST A PROFILE BY MEMBER ID
  app.get("/profile/:id", 
    require('connect-ensure-login').ensureLoggedIn('/login'),
    function(req, res) {      
      console.log("routehit", req.params.id);
      console.log("LOGGED IN", req.user);
      db.Member.findOne({
        where: {
          id: req.params.id
        },
      }).then(function(member){ 
        var profileObject = {
          favorite_book: member.dataValues.favorite_book,
        }
        console.log("profileObject: ", profileObject);
        console.log(profileObject.favorite_book);
        res.json(member);
    });
  });

  // UPDATE MEMBER'S CHAPTER PROGRESS FROM PROFILE PAGE
  app.post("/api/chapter", function(req, res) {
      require('connect-ensure-login').ensureLoggedIn('/login'),
        function(req,res) {
          console.log("this is" + req.user.email);

          res.json(req.user)
        }
        db.Member.findOne({
            where:{
                email: req.user.email
            }
        }).then(function(data){
            console.log(data);
            if(data){
                var member_id = data.dataValues.id;
                db.Member.findOne({
                    where:{
                        id: member_id
                    }
                }).then(function(data){
                    console.log("CHAPTER going to db: ", req.body.chapter);
                    console.log(data);
                        db.Member.update({
                            chapter: req.body.chapter
                        }, {
                            where: {
                                id: member_id
                            }
                        }).then(function() {
                          console.log("want to redirect")
                            res.redirect("/discuss");

                    });
                });
            };
      });
  });

  // UPDATE MEMBER PASSWORD AFTER NEW HASHED PASSWORD CREATED
  app.put('/api/update_password', function(req, res) {
      console.log("body", req.body.password);
      var newPassword = req.body.password; 
      var email = req.body.email;
      console.log(newPassword, email);
      var hashedPassword;
      var salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(req.user.password, salt);
        db.Member.findOne({
            where:{
                email: email
            }
        }).then(function(data){
            if(data){
                var member_id = data.dataValues.id;
                db.Member.update({
                    password: hashedPassword,
                },{
                    where: {
                        id: member_id
                    }
                }).then(function() {
                    res.send(true);
                });
            }else{
                res.send("invalid email");
            }
        })
    });

  // SEND MEMBER A NEW HASHED PASSWORD
  app.post('/api/send_email', function(req, res) {       
    var newPassword = randomstring.generate(8);
    var email = req.body.email;
    db.Member.findOne({
            where:{
                email:req.body.email
            }
        }).then(function(data){
            if(data){
                var member_id = data.dataValues.id;
                db.Member.findOne({
                    where:{
                        id : member_id
                    }
                }).then(function(data){
                    if(data){
                    var mailOptions = {
                        to: email,
                        subject: "Your Book Love Password Request",
                        text: "Here is your new Book Love password: " + newPassword,
                        html: "<body style='background-color: #e57373; text-align: center; padding-bottom: 15px; padding-top: 15px; font-family: Georgia; font-style: normal; font-size: 1.6rem;'><p style='color: #fffbe4; font-style: italic; font-size: 2.6rem;'>Book Love!</p><p style='color: #fffbe4;'>Here is your new Book Love password: </p><b>" + newPassword + "</b></p><p><a href='https://warm-sea-55516.herokuapp.com/' target='blank' style='color: #00CB88; font-size: 1.3rem; font-style: italic;'>Log in to Book Love</p></body>"
                    }
                    smtpTransport.sendMail(mailOptions, function(error, response){
                        if (error){
                            console.log(error);
                            res.send("error");
                        }else{
                            console.log("Message sent to: " + req.body.email);
                            var sendObject = {status: "sent", password: newPassword};
                            res.send(sendObject);
                            }
                    });
                    }else{
                        res.send("invalid user")
                    };
                });
             }else{
                res.send("invalid email")
            };
        });    
    }); 


  // GET USER SHELF FROM GOODREADS USING NPM PACKAGE
  app.get("/shelf", function(req, res) {
    let key = keys.grkey
    let secret = keys.grsecret

    let sample_user = 4085451;
    console.log("this is the selected user's shelf!");
    let dump = json => {
    // res.json(json);

    //looping through the books with .map in child vote//
    const books = json.GoodreadsResponse.books[0].book;
          
    res.json(JSON.stringify(books));
    // console.log(books.map(book => {
    // console.log('==================================');
    // console.log("book title", book.title);
    // console.log("book author", book.authors[0].author.name);
    // console.log("book imageUrl", book.image_url);
    // console.log("book description", book.description);
    // console.log("book rating", book.average_rating);
    // console.log('==================================');

    // }))
    };

    gr = goodreads.client({ 'key': key, 'secret': secret });
        let shelfOptions = { 'userID': sample_user, 'shelf': 'to-read' }

        let getShelf = gr.getSingleShelf(shelfOptions, dump);
        return getShelf;

    })

  // OTHER GET REQUETS THAT WE USE FOR TESTING
  app.get("/api/members", function(req, res) {
    db.Member.findAll({}).then(function(dbMember) {
      res.json(dbMember);
    });
  });

  app.get("/api/book", function(req, res) {
    db.Book.findAll({
      attributes: ['title']
    }).then(function(dbBook) {
        res.json(dbBook);
    });
  });

  app.get("/api/book/chapters", function(req, res) {
    db.Chapter.findAll({}).then(function(dbMember) {
        res.json(dbMember);
    });
  });

  app.get("/api/book/discussion", function(req, res) {
    db.Discussion.findAll({}).then(function(dbMember) {
        res.json(dbMember);
    });
  });

  app.get("/api/book/discussion/comments", function(req, res) {
    db.Discussion.findAll({
        attributes: ['comment', 'member_name', 'chapter']
    }).then(function(dbMember) {
      res.json(dbMember);
    });
  });

  app.get("/api/join", function(req, res) {
    db.MemberBook.findAll({}).then(function(dbMember) {
        res.json(dbMember);
    });
  });

};