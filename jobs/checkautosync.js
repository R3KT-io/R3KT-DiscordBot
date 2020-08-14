

async function checkAutosync(guildId, memberId, client, unban = false) {
    const guild = await global.r3kt.discordDBConn.getGuild(guildId)

    if (guild.followers) 
        guild.followers.forEach(async id => {
            const followingGuild = client.guilds.cache.get(id)
            if (!unban) {
                followingGuild.members.fetch(memberId)
                    .then(member => {
                        if (!unban) {
                            member.ban({
                                reason: 'R3KT AutoSync'
                            }).catch(e => {/*STUB*/})
                        }
                    })
                    .catch(e => { /* STUB */ })
            } else {
                followingGuild.members.unban(memberId, {
                    reason: 'R3KT AutoSync'
                }).catch(e => {/*STUB*/})
            }
        })
}

module.exports = checkAutosync