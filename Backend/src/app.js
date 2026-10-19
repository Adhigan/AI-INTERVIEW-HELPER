const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
     origin: ["http://localhost:5173", "https://witty-pebble-0d993e300.7.azurestaticapps.net"],
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)


const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:5173,https://witty-pebble-0d993e300.7.azurestaticapps.net"
).split(",").map(o => o.trim())

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))

// Simple health check for monitoring and post-deploy smoke tests.
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" })
})



module.exports = app