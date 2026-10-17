require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/database");
const {
    initializeStorage
} = require("./src/config/azureStorage");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();
        await initializeStorage();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(
            "Server startup failed:",
            error.message
        );
        process.exit(1);
    }
}

startServer();