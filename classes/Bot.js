const Discord = require('discord.js');
const chalk = require('chalk')

const { token } = require('../../../secure/discord/discord-creds')
const { config } = require ('../../../resources')

const {
    stats, autosync, unsync,
    infractions, bansync
} = require('../commands');

const {
    checkAutosync
} = require('../jobs')

const language = require('../../../resources/language');
const RateLimiter = require('../../abstracts/RateLimiter')

class DiscordBot extends RateLimiter {
    client
    rateLimitQueue

    constructor() {
        super()
        this.client = new Discord.Client()
        this.rateLimitQueue = method => this.addToQueue(method)
    }

    start() {
        if (config.LOG) {
			console.log(chalk.magenta(`»»» Establishing connection to Discord`))
			console.time(chalk.magenta(`««« Connected to Discord`))
		}
        this.client.on('ready', () => {
            console.timeEnd(chalk.magenta(`««« Connected to Discord`))
            this.watchBans()
            this.watchBanRemoves()
            this.watchCommands()
        })
        this.client.login(token)
    }

    buildGuild(guild) {
        return {
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            verificationLevel: guild.verificationLevel,
            lastUpdated: Date.now()
        }
    }

    buildEvent(user, guild, type) {
        return {
            time: Date.now(),
            channel: guild.id,
            issuer: 'SYSTEM',
            offender: user.username,
            platform: config.PLATFORMS.DISCORD,
            reason: null,
            type,
            meta: {
                userID: user.id
            }
        }
    }

    watchBans() {
        this.client.on('guildBanAdd', (guild, user) => {
            const guildData = this.buildGuild(guild)
            const eventData = this.buildEvent(user, guild, 'BAN')

            global.r3kt.discordDBConn.newEvent(
                guildData.id,
                eventData.issuer,
                eventData.offender,
                eventData.type,
                eventData.reason,
                eventData.meta
            )

            checkAutosync(guildData.id, user.id, this.client)
        })
    }

    watchBanRemoves() {
        this.client.on('guildBanRemove', (guild, user) => {
            const guildData = this.buildGuild(guild)
            const eventData = this.buildEvent(user, guild, 'UNBAN')

            global.r3kt.discordDBConn.newEvent(
                guildData.id,
                eventData.issuer,
                eventData.offender,
                eventData.type,
                eventData.reason,
                eventData.meta
            )

            checkAutosync(guildData.id, user.id, this.client, true)
        })
    }

    updateGuild(g) {
        const guild = this.buildGuild(g)
        global.r3kt.discordDBConn.updateGuild(guild)
    }

    exeIfAdmin(message, func) {
        const member = message.guild.member(message.author)
        const isAdministrator = member.hasPermission(['ADMINISTRATOR'])
        if (isAdministrator) {
            this.updateGuild(message.guild)
            func()
        } else {
            this.rateLimitQueue(() => 
                message.channel.send(`<@${message.author.id}> ${language.DISCORD.ADMIN_ONLY}`)
            )
        }
    }

    exeIfMod(message, func) {
        const member = message.guild.member(message.author)
        const isMod = member.hasPermission(['BAN_MEMBERS'])

        if (isMod) {
            this.updateGuild(message.guild)
            func()
        } else {
            this.rateLimitQueue(() => 
                message.channel.send(`<@${message.author.id}> ${language.DISCORD.MOD_ONLY}`)
            )
        }
    }

    watchCommands() {
        this.client.on('message', message => {
            // Global commands
            if (message.content.startsWith('!stats'))
                stats(message.guild, message, this.rateLimitQueue)
            // Admin commands
            if (message.content.startsWith('!init'))
                this.exeIfMod(message, () => {
                    this.rateLimitQueue(() => 
                        message.channel.send(language.DISCORD.INIT)
                    )
                })

            if (message.content.startsWith('!infractions'))
                this.exeIfMod(message, () => infractions(message, this.rateLimitQueue))
            if (message.content.startsWith('!lockdown'))
                this.exeIfMod(message, () => console.log('lockdown'))
            if (message.content.startsWith('!autosync'))
                this.exeIfAdmin(message, () => autosync(message, this.rateLimitQueue))
            if (message.content.startsWith('!unsync'))
                this.exeIfAdmin(message, () => unsync(message, this.rateLimitQueue))
            if (message.content.startsWith('!bansync'))
                this.exeIfAdmin(message, () => bansync(message, this.rateLimitQueue, this.client))
        })
    }

}

module.exports = DiscordBot