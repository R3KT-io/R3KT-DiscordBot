const mongoose = require('mongoose')

const Schema = mongoose.Schema

/**
 * Represents an events on a platform
 * this could be a ban, timeout, mute, etc.
 */
const Event = new Schema({
    time: Date,
    channel: {
        type: String,
        default: 'Global'
    },
    issuer: {
        type: String,
        default: 'Nobody'
    },
    offender: String,
    type: String,
    platform: {
        type: String,
        default: 'Unspecified'
    },
    reason: String,
    meta: Object
})

/**
 * Represents a channel our bot should track
 */
const DiscordGuild = new Schema({
    id: String,
    name: String,
    memberCount: Number,
    verificationLevel: String,
    lastUpdated: Date
})

mongoose.model('Event', Event)
mongoose.model('DiscordGuild', DiscordGuild)

module.exports = {
    Event,
    DiscordGuild
}