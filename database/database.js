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

    async autoSync(followerId, guildId) {
        const guildObj = await this.DiscordGuild.findOne({ id: guildId })
        if (guildObj == null) return language.NOT_USING_R3KT
        if (!guildObj.followers.includes(followerId)) {
            guildObj.followers = [...guildObj.followers, followerId]
            await guildObj.save((err) => {
                if (err) console.warn('Error saving sync data to database!', err)
            })
            return `${language.DISCORD.AUTOSYNC} **${guildObj.name}**`
        } else {
            return `${language.DISCORD.ALREADY_SYNCED} **${guildObj.name}**`
        }
    }

    async unSync(followerId, guildId) {
        const guildObj = await this.DiscordGuild.findOne({ id: guildId })
        if (guildObj == null) return language.NOT_USING_R3KT
        if (guildObj.followers.includes(followerId)) {
            guildObj.followers = [...guildObj.followers, followerId]
            guildObj.followers = guildObj.followers
                .filter(guild => guild !== followerId)
            await guildObj.save((err) => {
                if (err) console.warn('Error saving sync data to database!', err)
            })
            return `${language.DISCORD.UNSYNCED} **${guildObj.name}**`
        } else {
            return `${language.DISCORD.NOT_SYNCED} **${guildObj.name}**`
        }
    }

    /**
     * Update the guilds stats in the database
     * @param {Object} guild formatted guild object
     */
    async updateGuild(guild) {
        const guildObj = await this.DiscordGuild.findOne({ id: guild.id })
        if (guildObj == null) {
            const newGuild = new this.DiscordGuild(guild)
            newGuild.save(e => {
                if (e) console.log('Error saving guild', e)
            })
        } else {
            guildObj.name = guild.name
            guildObj.memberCount = guild.memberCount
            guildObj.verificationLevel = guild.verificationLevel
            guildObj.lastUpdated = Date.now()
            guildObj.save(e => {
                if (e) console.log('Error saving guild', e)
            })
        }
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
     * @param {Number} guildId guild ID to check for followers on
     * @returns {Object} returns Guild
     */
    async getGuild(guildId) {
        const guild = await this.DiscordGuild.findOne({ id: guildId })
        return guild
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
    async getBans(guild, platform, limit = 999) {
        const query = { channel: guild, type: 'BAN' }
        if (platform != null) query.platform = platform
        const channelBans = await this.Event.find(query).limit(limit)
        return channelBans
    }


    /**
     * Get a list of unbans on a specific channel
     * @param {String} channel channel to check unbans on
     * @param {String} platform platform to check for unbans on
     * @param {Number} limit amount of unbans to check
     * @returns {Array} returns an array
     */
    async getUnbans(guild, platform, limit = 999) {
        const query = { channel: guild, type: 'UNBAN' }
        if (platform != null) query.platform = platform
        const channelUnbans = await this.Event.find(query).limit(limit)
        return channelUnbans
    }

    /**
     * Find events for a specified user
     * @param {String} user User to find events
     * @param {String} type Type of event to filter by (optional)
     * @returns {Array} returns array of events
     */
    async getEvents(user, type = 'ANY') {
        const query = { meta: { userID: user } }
        if (type != 'ANY') query.type = type
        const events = await this.Event.find(query)
        return events
    }
}

module.exports = Database