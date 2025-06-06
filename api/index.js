const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({dest: 'uploads/'});
const fs = require('fs');

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfghjkloiuytre123456';

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads')); //Middleware for uploaded images and stores them locally 

// Database Connection
mongoose.connect('mongodb+srv://gdolor:gdolor@cluster0.upvitmk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

// Authentication Routes
app.post('/register', (req, res) =>{ // Registers a new user by hashing the password
    const {username,password} = req.body;
    try{
        const userDoc = User.create({
            username, 
            password:bcrypt.hashSync(password,salt)});
        res.json(userDoc);
    } catch(e){
        res.status(400).json(e);
    }
});

app.post('/login', async (req,res) => { // Verifies credentials and sends a JWT token as a cookie
    const {username,password} = req.body;
    const userDoc = await User.findOne({username});
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
        // logged in
        jwt.sign({username, id:userDoc._id}, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id:userDoc._id,
                username,
            });
        });
    } else {
        // not logged in
        res.status(400).json('wrong credentials');
    }
});

app.get('/profile', (req,res) => { // Returns user info (from the token)
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err, info) =>{
        if (err) throw err;
        res.json(info);
    });
});

app.post('/logout', (req,res) => { // Clears the authentication token cookie
    res.cookie('token', '').json('ok');
})

// Blog Post Routes
app.post('/post', uploadMiddleware.single('file'), async (req,res) => { // Creates a new blog post 
    const {originalname, path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length-1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) =>{ // Verifies the user via JWT
        if (err) throw err;
        const {title,summary,content} = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover:newPath,
            author:info.id,
        });
        res.json({postDoc}); 
    });
})

app.put('/post', uploadMiddleware.single('file'), async (req,res) => { // Updates a blog post
    let newPath = null;
    if (req.file){
        const {originalname, path} = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length-1];
        newPath = path+'.'+ext;
        fs.renameSync(path, newPath);
    }
    
    const {token} = req.cookies
    jwt.verify(token, secret, {}, async (err, info) =>{ // Verifies the user via JWT
        if (err) throw err;
        const {id,title,summary,content} = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor){
            return res.status(400).json('you are not the author');
        }

        await postDoc.updateOne({
            title,
            summary,
            content,
            cover: newPath ? newPath : postDoc.cover,
        });
        res.json(postDoc);
    });
});

app.get('/post', async (req,res) =>{ // Fetches the latest 20 posts
    res.json(
        await Post.find()
        .populate('author', ['username'])
        .sort({createdAt: -1})
        .limit(20)
    );
});

app.get('/post/:id', async (req, res) => { // Fetches a single post by ID
    const {id} = req.params;
    postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
})

app.delete('/post/:id', async (req, res) => { // Deletes a post 
    const { id } = req.params;
    const { token } = req.cookies;
  
    if (!token) return res.status(401).json("No token provided");
  
    jwt.verify(token, secret, async (err, userInfo) => { // Checks if the user is the author before authenticating deletion
      if (err) return res.status(401).json("Invalid token");
  
      try {
        const postDoc = await Post.findById(id);
        if (!postDoc) return res.status(404).json("Post not found");
  
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(userInfo.id);
        if (!isAuthor) return res.status(403).json("Forbidden");
  
        await postDoc.deleteOne();
        res.status(200).json("Post deleted");
      } catch (error) {
        res.status(500).json("Server error");
      }
    });
});
  
  


app.listen(4000);