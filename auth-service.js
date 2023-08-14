const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    "userName": {
        type: String,
        unique: true
    },
    "password": String,
    "email": String,
    "loginHistory": [
        {
            "dateTime": Date,
            "userAgent": String
        }
    ]
});
let User;

function initialize() {
    //TODO Update MONGODB URL
    return new Promise((resolve, reject) => {
        var database = mongoose.createConnection("MongoDB URL", { useNewUrlParser: true, useUnifiedTopology: true });
        database.on('error', (err) => {
            console.log(err);
            reject(err);
        });
        database.once('open', () => {
            User = database.model("Users", userSchema);
            resolve();
        });
    });
}

function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // Validation
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.hash(userData.password, 10)
                .then((hash) => {
                    userData.password = hash;
                    // create user
                    let newUser = new User(userData);
                    newUser.save().then(() => {
                        resolve();
                    }).catch(function (err) {
                        if (err.code === 11000) {
                            reject("User Name already taken");
                        } else {
                            reject(`There was an error creating the user: ${err}`);
                        }
                    });
                })
                .catch((err) => {
                    console.log(err);
                    reject("There was an error encrypting the password")
                });
        }
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.find({ "userName": userData.userName }).exec()
            .then(function (user) {
                if (user.length < 1) {
                    reject(`Unable to find user: ${userData.userName}`);
                } else {
                    bcrypt.compare(userData.password, user[0].password).then((result) => {
                        if (result === true) {
                            resolve(user[0]);
                        } else {
                            reject(`Incorrect password!`);
                        }
                    });

                    user[0].loginHistory.push({
                        "dateTime": new Date().toString(),
                        "userAgent": userData.userAgent
                    });
                    User.updateOne(
                        { "userName": user[0].userName },
                        { "$set": { "loginHistory": user[0].loginHistory } },
                        { "multi": false }
                    ).exec().then(() => {
                        resolve(user[0]);
                    }).catch((err) => {
                        reject(`There was an error verifying the user: ${err}`)
                    });
                }
            }).catch(() => {
                reject(`Unable to find user: ${userData.userName}`);
            });
    });
}

module.exports = { initialize, registerUser, checkUser }