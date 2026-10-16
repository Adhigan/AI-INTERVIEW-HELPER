
const mongoose = require("mongoose");

async function connectToDB() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI environment variable is missing");
    }

    await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000
    });

    console.log("Connected to MongoDB successfully");
}

module.exports = connectToDB;
