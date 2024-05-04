function sendMessageToChannel(client, channelId, messageContent) {
    console.debug('[DEBUG][sendMessageToChannel]', channelId, messageContent);
    return client.channels.fetch(channelId)
        .then(channel => {
            return channel.send(messageContent);
        });
}

async function botErrorReply(interaction) {
    console.debug('[DEBUG][botErrorReply]');
    try {
        interaction.reply({
            content: '机器人出错啦，请联系管理员。',
            ephemeral: true,
        });
    }
    catch (error) {
        console.error('[ERROR] ', error);
    }
}


module.exports = {
    sendMessageToChannel,
    botErrorReply,
};
