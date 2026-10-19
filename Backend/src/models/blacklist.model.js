const mongoose = require('mongoose')


const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [ true, "token is required to be added in blacklist" ]
    }
}, {
    timestamps: true
})
// Remove blacklisted tokens after 1 day (same as the JWT lifetime).
blacklistTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 })
const tokenBlacklistModel = mongoose.model("blacklistTokens", blacklistTokenSchema)


module.exports = tokenBlacklistModel