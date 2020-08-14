const { language } = require('../../../resources')

/**
 * Get statistics about R3KT bans & timeouts
 * on a specific user globally.
 * @param {String} channel channel requesting stats
 * @param {Object} rateLimitQueue reference to the rate limiter queue object
 */
async function infractions(message, rateLimitQueue) {
    const user = message.content.split(" ")[1]
    const mentionedUser = message.mentions.users.entries().next().value

    if (!user || !mentionedUser) {
        rateLimitQueue(() => 
            message.channel.send(language.DISCORD.PROVIDE_USER)
        )
        return
    }

    const userId = mentionedUser[0]
    const events = await global.r3kt.discordDBConn.getEvents(userId)
    const banEvents = events.filter(e => e.type == 'BAN')
    const unbanEvents = events.filter(e => e.type == 'UNBAN')

    rateLimitQueue(() => {
        message.channel.send(`<@${userId}> **Bans:** ${banEvents.length} | **Unbans:** ${unbanEvents.length}`)
    })
}

module.exports = infractions