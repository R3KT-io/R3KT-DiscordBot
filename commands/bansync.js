const { language } = require('../../../resources')
const usernameUtil = require('../../utils/usernames')
const chalk = require('chalk')

/**
 * Sync bans with another Discord guild
 * @param {Object} message discord client message object
 * @param {Object} rateLimitQueue reference to the rate limiter queue object
 */
async function bansync(message, rateLimitQueue, client) {
    const guildId = message.content.split(' ')[1]
    const guild = await global.r3kt.discordDBConn.getGuild(guildId)
    const guildBans = await global.r3kt.discordDBConn.getBans(guildId, 'DISCORD')
    const guildUnbans = await global.r3kt.discordDBConn.getUnbans(guildId, 'DISCORD')
    console.log(
        chalk.green(
            `${message.author.username} syncing ${guildBans.length} ban(s) with guild ${guild.name}.`
        )
    )
    rateLimitQueue(() => {
        message.channel.send(`Syncing **${guildBans.length} ban(s)** with guild **${guild.name}**.`)
    })
    guildBans.forEach((ban, i) => {
        rateLimitQueue(() => {
            message.guild.members
                .ban(ban.meta.userID, { reason: 'R3KT Ban Sync'})
                .catch(err => {
                    console.log(chalk.yellow(`Failed to ban ${ban.meta.userID}`))
                })
        })
        if(i === guildBans.length - 1) {
            processUnbans()
        }
    })
    function processUnbans() {
        guildUnbans.forEach(unban => {
            rateLimitQueue(() => {
                message.guild.members
                    .unban(unban.meta.userID, 'R3KT Unban Sync')
                    .catch(err => {
                        console.log(chalk.yellow(`Failed to unban ${unban.meta.userID}`))
                    })
            })
        })
    }
}

module.exports = bansync