/**
 * Get statistics about R3KT bans & timeouts
 * on this channel and globally.
 * @param {String} channel channel requesting stats
 * @param {Object} rateLimitQueue reference to the rate limiter queue object
 */
async function stats(guild, message, rateLimitQueue) {
    const stats = await global.r3kt.discordDBConn.getStats(guild)
    rateLimitQueue(() => {
        message.channel.send(`**Server Bans:** ${stats.guildBans} | **Global Bans:** ${stats.globalBans}`)
    })
}

module.exports = stats