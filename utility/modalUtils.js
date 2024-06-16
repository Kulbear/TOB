const {
    ModalBuilder,
    TextInputStyle,
    TextInputBuilder,
    ActionRowBuilder,
} = require('discord.js');

function buildQuestPublishModal() {
    const modal = new ModalBuilder()
        .setCustomId('publishQuestModal')
        .setTitle('发布新任务');

    const questDescriptionInput = new TextInputBuilder()
        .setCustomId('questDescriptionInput')
        .setLabel('要发布的任务是关于...')
        .setPlaceholder('任务名称（任务名称，然后回车输入描述）\n任务描述（换行后开始输入任务描述）')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(2500)
        .setMinLength(2);

    const questDurationInput = new TextInputBuilder()
        .setCustomId('questDurationInput')
        .setLabel('任务截止时间是...')
        .setPlaceholder('格式示例: 1w2d4h30m, 1d12h, 10d, 3h30m...')
        .setStyle(TextInputStyle.Short);

    const questRewardInput = new TextInputBuilder()
        .setCustomId('questRewardInput')
        .setLabel('任务奖励是...')
        .setPlaceholder('奖励描述...')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(2500)
        .setMinLength(2);

    const questMultipleTakerInput = new TextInputBuilder()
        .setCustomId('questMultipleTakerInput')
        .setLabel('任务是否可被多人接取')
        .setPlaceholder('1 for yes, 0 for no')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(10)
        .setMinLength(1);

    const questRepeatableInput = new TextInputBuilder()
        .setCustomId('questRepeatableInput')
        .setLabel('任务是否可单人重复接取')
        .setPlaceholder('1 for yes, 0 for no')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(10)
        .setMinLength(1);

    modal.addComponents(
        new ActionRowBuilder().addComponents(questDescriptionInput),
        new ActionRowBuilder().addComponents(questDurationInput),
        new ActionRowBuilder().addComponents(questRewardInput),
        new ActionRowBuilder().addComponents(questMultipleTakerInput),
        new ActionRowBuilder().addComponents(questRepeatableInput),
    );

    return modal;
}


module.exports = {
    buildQuestPublishModal,
};
