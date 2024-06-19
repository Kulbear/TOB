// Require the necessary discord.js classes

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

const { token, debugChannelId, vcMonitoringChannelId } = require('./config.json');
const { supabaseUrl, supabaseKey } = require('./config.json');
const { createClient } = require('@supabase/supabase-js');

const {
    onVoiceChannelUserActivity,
} = require('./utility/voiceChannelHelpers.js');

const {
    onPublishQuestModalSubmit,
    onQuestInfoButtonClick,
    onQuestApproveModalSubmit,
    onQuestInstanceInfoButtonClick,
} = require('./utility/questHelper.js');

const {
    onGuildAvailableInfoLog,
    onGuildAvailableBatchInitUsers,
    onUserAddToGuild,
    onUserRemoveFromGuild,
} = require('./utility/playerProfile.js');

const { onUserMessageCreate } = require('./utility/messageHelper.js');

const { sendMessageToChannel } = require('./utility/guildMessages.js');

const supabase = createClient(supabaseUrl, supabaseKey);
console.debug('[DEBUG] Supabase app initialized...');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// Create a new Collection to hold your commands.
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
        else {
            console.debug(
                `[DEBUG] The command at ${filePath} is missing a required "data" or "execute" property.`,
            );
        }
    }
}

client.once(Events.ClientReady, (readyClient) => {
    console.debug(`Ready! Logged in as ${readyClient.user.tag}`);
    sendMessageToChannel(
        client,
        debugChannelId,
        '我们伟大的 **TOB** 已经降临这个位面了!',
    );
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    onUserMessageCreate(client, supabase, message);
});

client.on(Events.GuildAvailable, async (guild) => {
    onGuildAvailableInfoLog(guild);
    onGuildAvailableBatchInitUsers(supabase, guild);
});

// when user join server
client.on(Events.GuildMemberAdd, async (member) => {
    console.debug(`用户 <@${member.user.id}> 刚刚加入了服务器!`);
    onUserAddToGuild(supabase, member);
    sendMessageToChannel(
        client,
        debugChannelId,
        `用户 <@${member.user.id}> 刚刚加入了服务器!`,
    );
});

// wher user leave server
client.on(Events.GuildMemberRemove, async (member) => {
    console.debug(`用户 <@${member.user.id}> 刚刚离开了服务器!`);
    onUserRemoveFromGuild(supabase, member);
    sendMessageToChannel(
        client,
        debugChannelId,
        `用户 <@${member.user.id}> 刚刚离开了服务器!`,
    );
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const oldChannel = oldState.channelId;
    const newChannel = newState.channelId;

    // this is a collection
    // get the first item
    const oldChannelObj = client.channels.cache.get(oldChannel);
    const newChannelObj = client.channels.cache.get(newChannel);

    if (oldChannel === null) {
        sendMessageToChannel(
            client,
            vcMonitoringChannelId,
            `<@${oldState.id}> 进入了 \`${newChannelObj.name}\``,
        );
        onVoiceChannelUserActivity(client, supabase, oldState.id, 'UserJoinVC');
    }
    else if (oldChannel !== null && newChannel !== null) {
        if (oldChannel === newChannel || oldChannelObj.name === newChannelObj.name) return;
        sendMessageToChannel(
            client,
            vcMonitoringChannelId,
            `<@${oldState.id}> 从 \`${oldChannelObj.name}\` 移动到 \`${newChannelObj.name}\``,
        );
        onVoiceChannelUserActivity(client, supabase, oldState.id, 'UserSwitchVC');
    }
    else {
        sendMessageToChannel(
            client,
            vcMonitoringChannelId,
            `<@${oldState.id}> 退出了 \`${oldChannelObj.name}\``,
        );
        onVoiceChannelUserActivity(client, supabase, oldState.id, 'UserLeaveVC');
    }
});

client.on(Events.InteractionCreate, async (interaction) => {

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'publishQuestModal') {
            onPublishQuestModalSubmit(interaction, supabase);
        }
        if (interaction.customId === 'approveCompletionModal') {
            onQuestApproveModalSubmit(interaction, supabase);
        }
        return;
    }
    if (interaction.isButton()) {
        if (
            interaction.customId === 'previousQuest' ||
            interaction.customId === 'acceptQuest' ||
            interaction.customId === 'deleteQuest' ||
            interaction.customId === 'nextQuest'
        ) {
            onQuestInfoButtonClick(interaction, supabase);
        }
        if (
            interaction.customId === 'approveCompletion' ||
            interaction.customId === 'rejectCompletion' ||
            interaction.customId === 'previousQuestReview' ||
            interaction.customId === 'nextQuestReview'
        ) {
            onQuestInstanceInfoButtonClick(interaction, supabase);
        }
    }

    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);


    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction, supabase);
    }
    catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        }
        else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        }
    }
});

// Log in to Discord with your client's token
client.login(token);
