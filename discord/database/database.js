const mongoose = require('mongoose');
const chalk = require('chalk')

const { uri } = require('../../../secure/database')
const { config } = require('../../../resources');
const usernameUtil = require('../../utils/usernames')

const language = require('../../../resources/language');

// Load and register schemas
require('./schemas')

class Database {
    connected = false
    Event = null
    DiscordGuild = null

    /**
     * Represents a new database handler
     * @constructor
     */
    constructor() {
        if (config.LOG) {
            console.time(chalk.green(config.BOTS.DISCORD.PREFIX + " »»» Connected to MongoDB"))
            console.log(chalk.green(config.BOTS.DISCORD.PREFIX + " ««« Establishing MongoDB connection"))
        }

        mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(() => {
            this.startup()
        })
    }

    /**
     * Schema binding, and other startup tasks
     * @method
     */
    startup() {
        this.connected = true
        // Register Models
        this.Event = mongoose.model('Event')
        this.DiscordGuild = mongoose.model('DiscordGuild')
        // Startup complete
        if (config.LOG)
            console.timeEnd(chalk.green(config.BOTS.DISCORD.PREFIX + " »»» Connected to MongoDB"))
    }

    /**
     * Check if we're connected to the remote database
     * @method
     * @returns {Boolean} returns wether or not we're connected to the DB
     */
    isConnected() {
        return this.connected
    }

    /**
     * Write a new event to the database
     * @param {String} channel Channel the event happened on
     * @param {String} user The user whom triggered the event
     * @param {String} offender The actor in the event
     * @param {String} type The type of event
     * @param {String} reason The reason this event was triggered
     * @param {String} meta Additional info about the event
     */
    newEvent(channel, user = 'Automod', offender, type, reason = 'Unspecified', meta) {
        console.log(chalk.gray(`${type}: ${user} on Discord ID ${channel}`))

        const newEvent = new this.Event({
            time: Date.now(),
            platform: config.PLATFORMS.DISCORD,
            issuer: user,
            channel,
            offender,
            type,
            reason,
            meta
        })

        newEvent.save((err) => {
            if (err) console.warn('Error saving event to database!', err)
        })
    }

    /**
     * Get a list of staticstics both globally, and on the specified channel
     * @param {String} channel channel to get statistics on
     * @returns {Object} list of stats
     */
    async getStats(guild) {
        const guildBans = await this.Event.where({ channel: guild.id, type: 'BAN' }).countDocuments().exec()
        const globalBans = await this.Event.where({ type: 'BAN' }).countDocuments().exec()

        return {
            guildBans,
            globalBans
        }
    }
    /**
     * Get a list of bans on a specific channel
     * @param {String} channel channel to check bans on
     * @param {String} platform platform to check for bans on
     * @param {Number} limit amount of bans to check
     * @returns {Array} returns an array
     */
    async getBans(channel, platform, limit = 999) {
        const query = { channel, type: 'BAN' }
        if (platform != null) query.platform = platform
        const channelBans = await this.Event.find(query).limit(limit)
        return channelBans
    }

    /**
     * Find events for a specified user
     * @param {String} user User to find events
     * @param {String} type Type of event to filter by (optional)
     * @returns {Array} returns array of events
     */
    async getEvents(user, type) {
        const query = { offender: utils.usernameUtil.strip(user) }
        if (type != null) query.type = type
        const events = await this.Event.find(query)
        return events
    }
}

module.exports = Database