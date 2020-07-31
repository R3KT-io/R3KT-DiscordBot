const Discord = require('discord.js');
const chalk = require('chalk')

const { token } = require('../../../secure/discord/discord-creds')
const { config } = require ('../../../resources/')

const {
    stats
} = require('../commands');
const language = require('../../../resources/language');

class DiscordBot {
    client

    constructor() {
        this.client = new Discord.Client()
        if (config.LOG) {
			console.log(chalk.magenta(`»»» Establishing connection to Discord`))
			console.time(chalk.magenta(`««« Connected to Discord`))
		}
        this.client.on('ready', () => {
            this.start()
            console.timeEnd(chalk.magenta(`««« Connected to Discord`))
        })
        this.client.login(token)
    }

    start() {
        this.watchBans()
        this.watchBanRemoves()
        this.watchCommands()
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
        })
    }

    exeIfAdmin(message, func) {
        const member = message.guild.member(message.author)
        const isAdministrator = member.hasPermission(['ADMINISTRATOR'])
        if (isAdministrator) {
            func()
        } else {
            message.channel.send(`<@${message.author.id}> ${language.DISCORD.ADMIN_ONLY}`)
        }
    }

    exeIfMod(message, func) {
        const member = message.guild.member(message.author)
        const isMod = member.hasPermission(['BAN_MEMBERS'])
        if (isMod) {
            func()
        } else {
            message.channel.send(`<@${message.author.id}> ${language.DISCORD.MOD_ONLY}`)
        }
    }

    watchCommands() {
        this.client.on('message', message => {
            // Global commands
            if (message.content.startsWith('!stats'))
                stats(message.guild, message)
            // Admin commands
            if (message.content.startsWith('!infractions'))
                this.exeIfMod(message, () => console.log('infractions'))
            if (message.content.startsWith('!lockdown'))
                this.exeIfMod(message, () => console.log('lockdown'))
            if (message.content.startsWith('!autosync'))
                this.exeIfAdmin(message, () => console.log('autosync'))
            if (message.content.startsWith('!unsync'))
                this.exeIfAdmin(message, () => console.log('unsync'))
            if (message.content.startsWith('!bansync'))
                this.exeIfAdmin(message, () => console.log('bansync'))
        })
    }

}

module.exports = DiscordBot