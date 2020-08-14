const { language } = require('../../../resources')
const usernameUtil = require('../../utils/usernames')

/**
 * Remove a subscriber from a guilds followers
 * @param {Object} message discord client message object
 * @param {Object} rateLimitQueue reference to the rate limiter queue object
 */
async function unsync(message, rateLimitQueue) {
    const guildId = message.content.split(' ')[1]
    const follow = await this.r3kt.discordDBConn.unSync(message.guild.id, guildId)
    rateLimitQueue(() => message.channel.send(follow))
}

module.exports = unsync