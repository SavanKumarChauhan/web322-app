/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part 
* of this assignment has been copied manually or electronically from any other source 
* (including 3rd party web sites) or distributed to other students.
* 
* Name: Savankumar Ratnaji Chauhan Student ID: 134823210 Date:2023-08-14
*
* Cyclic Web App URL: https://drab-erin-wasp-kit.cyclic.cloud

* 
* GitHub Repository URL:https://github.com/SavanKumarChauhan/web322-app.git
*
********************************************************************************/


const express = require('express');
const blogData = require("./blog-service");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const path = require("path");
const stripJs = require('strip-js');
const authData = require('./auth-service');
const clientSessions = require('client-sessions');
const app = express();

app.use(clientSessions({
    cookieName: "session",
    secret: "week10example_web322", 
    duration: 2 * 60 * 1000, 
    activeDuration: 1000 * 60 
}));

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

const HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({ 
    cloud_name: 'dwoz14lux', 
    api_key: '832585539411595', 
    api_secret: 'UWqkh7I2QZU5bz5IpT-YDQH7yGY' 
  });

const upload = multer();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function (context) {
            return stripJs(context);
        },
        formatDate: function (dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
});
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

app.get('/', (req, res) => {
    res.redirect("/blog");
});

app.get('/about', (req, res) => {
    res.render("about", { layout: "main" });
});

app.get('/blog', async (req, res) => {

    
    let viewData = {};

    try {

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0];

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData })

});

app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try {

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the post by "id"
        viewData.post = await blogData.getPostById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData })
});

app.get('/posts', ensureLogin, (req, res) => {

    let queryPromise = null;

    if (req.query.category) {
        queryPromise = blogData.getPostsByCategory(req.query.category);
    } else if (req.query.minDate) {
        queryPromise = blogData.getPostsByMinDate(req.query.minDate);
    } else {
        queryPromise = blogData.getAllPosts()
    }

    queryPromise.then(data => {
        if (data.length > 0) {
            res.render("posts", { posts: data });
        } else {
            res.render("posts", { message: "no results" });
        }
    }).catch(err => {
        res.render("posts", { message: err });
    });

});

app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req, res) => {

    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processPost(uploaded.url);
        });
    } else {
        processPost("");
    }

    function processPost(imageUrl) {
        req.body.featureImage = imageUrl;

        blogData.addPost(req.body).then(post => {
            res.redirect("/posts");
        }).catch(err => {
            res.status(500).send(err);
        })
    }
});

app.get('/posts/add', ensureLogin, (req, res) => {
    blogData.getCategories().then((data) => {
        res.render('addPost', { layout: 'main', categories: data });
    }).catch((err) => {
        res.render('addPost', { layout: 'main', categories: [] });
    });
});

app.get('/post/:id', ensureLogin, (req, res) => {
    blogData.getPostById(req.params.id).then(data => {
        res.json(data);
    }).catch(err => {
        res.json({ message: err });
    });
});

app.post("/categories/add", ensureLogin, (req, res, next) => {
    let category = {
        category: req.body.category
    };
    blogData.addCategory(category)
        .then(() => {
            res.redirect("/categories");
        })
        .catch((error) => {
            res.status(500).send(error);
        });
});

app.get('/categories', ensureLogin, (req, res) => {
    blogData.getCategories().then((data => {
        if (data.length > 0) {
            res.render("categories", { categories: data });
        } else {
            res.render("categories", { message: "no results" });
        }
    })).catch(err => {
        res.render("categories", { message: err });
    });
});

app.get('/categories/add', ensureLogin, (req, res) => {
    res.render('addCategory', { layout: "main" })
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
    blogData.deleteCategoryById(req.params.id).then(() => {
        res.redirect("/categories");
    }).catch((err) => {
        res.status(500).send("Unable to Remove Category/Category not found");
    });
});

app.get("/posts/delete/:id", ensureLogin, (req, res) => {
    blogData.deletePostById(req.params.id).then(() => {
        res.redirect("/posts");
    }).catch((err) => {
        res.status(500).send("Unable to Remove Post/Post not found");
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render('register', { successMessage: 'User created' });
        })
        .catch((err) => {
            res.render('register', { errorMessage: err, userName: req.body.userName });
        });
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/posts');
        })
        .catch((err) => {
            res.render('login', { errorMessage: err, userName: req.body.userName });
        });
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});

app.use((req, res) => {
    res.status(404).render("404");
});

blogData.initialize().then(authData.initialize).then(() => {
    app.listen(HTTP_PORT, () => {
        console.log('server listening on: ' + HTTP_PORT);
    });
}).catch((err) => {
    console.log(err);
});


