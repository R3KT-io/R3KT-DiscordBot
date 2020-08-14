const { language } = require('../../../resources')
const usernameUtil = require('../../utils/usernames')

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
    rateLimitQueue(() => {
        message.channel.send(`Syncing **${guildBans.length} ban(s)** with guild **${guild.name}**.`)
    })
    guildBans.forEach(ban => {
        rateLimitQueue(() => {
            const g = client.guilds.cache.get(guildId)
            g.members.ban(ban.meta.userID, { reason: 'R3KT Ban Sync'})
        })
    })
    guildUnbans.forEach(unban => {
        rateLimitQueue(() => {
            const g = client.guilds.cache.get(guildId)
            g.members.unban(unban.meta.userID, 'R3KT Unban Sync')
        })
    })
}

module.exports = bansync