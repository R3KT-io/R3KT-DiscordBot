const { language } = require('../../../resources')
const usernameUtil = require('../../utils/usernames')

/**
 * Add a follower to a guilds bans
 * @param {Object} message discord client message object
 * @param {Object} rateLimitQueue reference to the rate limiter queue object
 */
async function autosync(message, rateLimitQueue) {
    const guildId = message.content.split(' ')[1]
    const follow = await this.r3kt.discordDBConn.autoSync(message.guild.id, guildId)
    if (follow != null)
    rateLimitQueue(() => message.channel.send(follow))
}

module.exports = autosync