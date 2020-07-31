const chalk = require('chalk')
const { language } = require("../../resources")

const DiscordBot = require('./classes/DiscordBot')
const Database = require('./database/database')

global.r3kt = {
    discordDBConn: new Database()
}

// We want to wait for the database connection before attempting
// so that we can properly get channels and log events
const start = async () => {
    // Whatever is here will be executed as soon as the script is loaded.
    if (global.r3kt.discordDBConn.isConnected()) {
        new DiscordBot()
        return
    }
    console.log(chalk.yellow(language.DB_PENDING))
    setTimeout(start, 500)
}
start()