const mongoose = require('mongoose');
const { mongoUri } = require('./default.json');


const connectMongoDb = async () => {
    try {
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Mongodb Connected');
    }
    catch (error) {
        console.log("Error while connection with Mongodb" + error)
        process.exit(1);
    }
}

module.exports = connectMongoDb;

