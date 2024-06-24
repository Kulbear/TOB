const {
    EmbedBuilder,
} = require('discord.js');


function sendMessageToChannel(client, channelId, messageContent) {
    console.debug('[DEBUG][sendMessageToChannel]', channelId, messageContent);
    const embed = new EmbedBuilder()
        .setTitle('Message from TOB...')
        .setDescription(messageContent)
        .setColor('#1666b1')
        .setFooter({
            text: '🤖 TOB is watching you!',
        })
        .setTimestamp();

    return client.channels.fetch(channelId)
        .then(channel => {
            return channel.send({ embeds: [embed] });
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
