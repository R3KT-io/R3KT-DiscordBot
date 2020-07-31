/**
 * Get statistics about R3KT bans & timeouts
 * on this channel and globally.
 * @param {String} channel channel requesting stats
 * @param {Object} chatClient reference to the chatClient
 */
async function stats(guild, message) {
    const stats = await global.r3kt.discordDBConn.getStats(guild)
    message.channel.send(`**Server Bans:** ${stats.guildBans} | **Global Bans:** ${stats.globalBans}`)
}

module.exports = stats