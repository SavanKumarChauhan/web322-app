const Sequelize = require('sequelize');
const { gte } = Sequelize.Op;

var sequelize = new Sequelize('	awkdhmld', 'awkdhmld', 'UAJa9UHe97n6HFn68dpNy0jPDvu07h4n', {
    host: 'drona.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

var Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
});

var Category = sequelize.define('Category', {
    category: Sequelize.STRING
});
Post.belongsTo(Category, { foreignKey: 'category' });

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(function () {
            resolve()
        }).catch(function (err) {
            console.error(err);
            reject('unable to sync to DB')
        });
    });
}

module.exports.getAllPosts = function () {
    return new Promise((resolve, reject) => {
        Post.findAll().then((data) => {
            resolve(data)
        }).catch((err) => {
            console.error(err);
            reject('no results returned')
        });
    });
}

module.exports.getPostsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: { category: category }
        }).then((data) => {
            resolve(data)
        }).catch((err) => {
            console.error(err);
            reject('no results returned')
        });
    });
}

module.exports.getPostsByMinDate = function (minDateStr) {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                postDate: { [gte]: new Date(minDateStr) }
            }
        }).then((data) => {
            resolve(data)
        }).catch((err) => {
            console.error(err);
            reject('no results returned')
        });
    });
}

module.exports.getPostById = function (id) {
    return new Promise((resolve, reject) => {
        Post.findAll({ where: { id: id } }).then(function (data) {
            resolve(data[0]);
        }).catch(function (err) {
            console.error(err);
            reject('no results returned')
        });
    });
}

module.exports.addPost = function (postData) {
    return new Promise((resolve, reject) => {
        postData.published = (postData.published) ? true : false;
        for (var key in postData) {
            if (postData[key] === "")
                postData[key] = null;
        }
        postData.postDate = new Date();

        Post.create(postData).then(function () {
            resolve()
        }).catch(function (err) {
            console.error(err);
            reject('unable to create post')
        });
    });
}

module.exports.getPublishedPosts = function () {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: { published: true }
        }).then(function (data) {
            resolve(data)
        }).catch(function (err) {
            console.error(err);
            reject('no results returned')
        });
    });
}

module.exports.getPublishedPostsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                published: true,
                category: category
            }
        }).then(function (data) {
            resolve(data)
        }).catch(function (err) {
            console.error(err);
            reject('no results returned')
        });
    });
}

module.exports.getCategories = function () {
    return new Promise((resolve, reject) => {
        Category.findAll().then(function (data) {
            resolve(data);
        }).catch(function (err) {
            console.error(err);
            reject('no results returned');
        });
    });
}

module.exports.addCategory = function (categoryData) {
    return new Promise((resolve, reject) => {

        for (var key in categoryData) {
            if (categoryData[key] === "")
                categoryData[key] = null;
        }
        Category.create(categoryData).then(function () {
            resolve();
        }).catch(function (err) {
            console.error(err);
            reject('unable to create category');
        });
    });
}

module.exports.deleteCategoryById = function (id) {
    return new Promise((resolve, reject) => {
        Category.destroy({ where: { id: id } })
            .then(function () {
                resolve("destroyed")
            }).catch(function (err) {
                console.error(err)
                reject("unable to delete category")
            })
    });
}

module.exports.deletePostById = function (id) {
    return new Promise((resolve, reject) => {
        Post.destroy({ where: { id: id } })
            .then(function () {
                resolve("destroyed")
            }).catch(function (err) {
                console.error(err)
                reject("unable to delete post")
            })
    });
}