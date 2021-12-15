const express = require('express');
const router = express.Router();
const registration = require('../models/user');
const records = require('../models/record');
const path = require('path');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const shortid = require('shortid');

dotenv.config();

function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '60s' });
}


router.use(['/Home', '/URLs'], (req, res, next) => {
    if(req.session.userid){
        records.find({Userid : req.session.userid}, (err, result) => {
            if (result){
                for (obj of result){
                    jwt.verify(obj.Token, process.env.TOKEN_SECRET, async (er, payload) => {
                        if(er){
                            await records.findOneAndDelete({Userid : obj.Userid, ShortURL : obj.ShortURL})
                        }
                    })
                }
                next();
            }else{
                res.send(err);
            }
        });
    }else{
        res.send(err);
    }  
})


router.route(['/', '/Login'])
    .get((req, res) => {
        if(req.session.userid){
            res.redirect("/Home")
        } else{
            res.render('Login', { title : 'Login', errormessage : ''});
        }        
    })
    .post((req, res) => {
        const data = req.body;
        registration.findOne({Email : data.email, Password : data.password}, (err, result) =>{
            if (result){
                req.session.userid = result._id.toString();
                res.redirect("/Home")
            }else {
                res.render("Login", { title : 'Login', errormessage : 'Incorrect Email or Password'});
            }
        });
    })


router.route('/Signup')
    .get((req, res) => {
        if(req.session.userid){
            res.redirect("/Home")
        } else{
            res.render('Signup', { title : 'Signup', errormessage : ''});
        } 
    })
    .post((req, res) => {
        const data = req.body;
        
        if (data.name && data.email && data.password && data.confirmpassword){
            registration.findOne({Email : data.email}, async (err, result) =>{
                if(result){
                    res.render('Signup', { title : 'Signup', errormessage : 'This email already exists. Please try different email.'})
                } else{
                    if (data.password == data.confirmpassword){
                        const user = new registration({Name : req.body.name, Email : req.body.email, Password : req.body.password});
                        await user.save();
                        registration.findOne({Email : data.email}, (err, result) =>{
                            if(err){
                                res.status(500).send(err);
                            }else{
                                req.session.userid = result._id.toString();
                                res.redirect("/Home")
                            }
                        })
                    } else{
                        res.render('Signup', { title : 'Signup', errormessage : "Those passwords didn't match. Try again."})
                    }
                }
            })
        } else{
            res.render('Signup', { title : 'Signup', errormessage : 'Please fill all the fields'});
        }
        
    })


router.route("/Home")
    .get((req, res) => {
        if(req.session.userid){
            registration.find({_id : req.session.userid}, (err, result) => {
                if(result){
                    res.render('Home', { title : 'Home', name : result[0].Name, success : '', errormessage : ''});
                }else{
                    req.send(err);
                }
            })
        } else{
            res.redirect("/Login")
        }        
    })
    .post((req, res) => {
        const data = req.body;
        if(data.url){
            records.findOne({URL : data.url, Userid : req.session.userid}, (err, result) => {
                if(result){
                    registration.findOne({_id : req.session.userid}, (er, resu) =>{
                        if(resu){
                            res.render('Home', { title : 'Home', name : resu.Name, success : '',
                            errormessage : 'URL already exists.'});
                        }else{
                            res.status(500).send(er);
                        }
                    })
                }else{
                    registration.findOne({_id : req.session.userid}, (err1, result1) => {
                        if(err1){
                            res.status(500).send(err1);
                        }else{
                            const shrt = shortid.generate();
                            const token = generateAccessToken({ usermail: result1.Email, url : data.url });
                            const rec = new records({Userid: req.session.userid, URL: data.url, ShortURL: shrt,
                                CreatedOn: new Date(), Token : token});
                            rec.save()
                            res.render('Home', { title : 'Home', name : result1.Name, success : 'URL added successfully.',
                             errormessage : ''});
                        }
                    })
                    
                }
            })
        }else{
            res.render('Home', { title : 'Home', name : result.Name, success : '', errormessage : 'Invalid data'});
        }        
    })


router.route("/Logout")
    .get((req, res) => {
        if(req.session.userid){
            req.session.destroy((err) => {
                if(err){
                    res.send(err);
                }else{
                    res.redirect("/Login");
                }
            })
        }else{
            res.redirect("/Login");
        }        
    })


router.route("/URLs")
    .get((req, res) => {
        if(req.session.userid){
            records.find({Userid : req.session.userid}, (err, result) => {
                if(result){
                    res.render('URLs', { title : 'URLs', result : result, errormessage : ''});
                }else{
                    res.send(err);
                }
            })   
        } else{
            res.redirect("/Login")
        }        
    });


router.route("/:Shrturl")
    .get((req, res) =>{
        records.findOne({Userid : req.session.userid, ShortURL : req.params.Shrturl}, (err, result) => {
            if(result){
                jwt.verify(result.Token, process.env.TOKEN_SECRET, async (er, payload) => {
                    if(er){
                        await records.findOneAndDelete({Userid : req.session.userid, ShortURL : req.params.Shrturl})
                        records.find({Userid : req.session.userid}, (error, result1) => {
                            if(result1){
                                res.render('URLs', { title : 'URLs', result : result1, errormessage : 'URL is expired'});
                            }else{
                                res.send(error);
                            }
                        })
                    }else{
                        if(result.Count >= 5){
                            res.render('URLs', { title : 'URLs', result : result, errormessage : 'URL limit exceeded'});
                        }else{
                            result.Count++;
                            records.findOneAndUpdate({Userid : req.session.userid, ShortURL : req.params.Shrturl},
                                    {Count : result.Count}, (err, data) => {
                                        if(err){
                                            res.status(500).send(err);
                                        }else{
                                            res.redirect(data.URL);
                                        }
                                    });
                        }
                    }
                })       
            }else{
                res.status(500).send(err);
            }
        })
    });

    
module.exports = router;