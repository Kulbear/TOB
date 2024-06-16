const {
    SlashCommandBuilder,
} = require('discord.js');

const { buildQuestPublishModal } = require('../../utility/modalUtils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('Quest related options...')
    // Subcommand for general users
        .addStringOption(option =>
            option.setName('ops')
                .setDescription('[General] Publish a quest...')
                .setRequired(true)
                .addChoices(
                    { name:'publish', value:'publish' },
                    { name:'review', value:'review' },
                    { name:'complete', value:'complete' },
                    { name:'list', value:'list' },
                )),
    async execute(interaction, supabase) {
        if (interaction.options.getString('ops') === 'publish') {
            console.debug('[DEBUG] "/quest publish" command received.');

            const modal = buildQuestPublishModal();

            // expected to be handled by onPublishQuestModalSubmit
            interaction.showModal(modal);
        }
        if (interaction.options.getString('ops') === 'review') {
            console.debug('[DEBUG] "/quest review" command received.');
        }
        if (interaction.options.getString('ops') === 'complete') {
            console.debug('[DEBUG] "/quest complete" command received.');
        }
        if (interaction.options.getString('ops') === 'list') {
            console.debug('[DEBUG] "/quest list" command received.');
        }
    },
};