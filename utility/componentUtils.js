const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

function buildQuestInfoButtonRow(start, end, current) {
    const actionRow = new ActionRowBuilder();
    if (current != start) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('previousQuest')
                .setLabel('<- 前一个')
                .setStyle('Primary'),
        );
    }
    actionRow.addComponents(
        new ButtonBuilder()
            .setCustomId('acceptQuest')
            .setLabel('✅ 接受任务')
            .setStyle('Success'),
    );
    if (current != end) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('nextQuest')
                .setLabel('下一个 ->')
                .setStyle('Primary'),
        );
    }

    return actionRow;
}

function buildQuestReviewButtonRow(start, end, current) {
    const actionRow = new ActionRowBuilder();
    if (current != start) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('previousQuestReview')
                .setLabel('<- 前一个')
                .setStyle('Primary'),
        );
    }
    actionRow.addComponents(
        new ButtonBuilder()
            .setCustomId('approveCompletion')
            .setLabel('✅ 批准完成任务')
            .setStyle('Success'),
    );
    actionRow.addComponents(
        new ButtonBuilder()
            .setCustomId('rejectCompletion')
            .setLabel('❌ 驳回完成任务')
            .setStyle('Danger'),
    );
    if (current != end) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('nextQuestReview')
                .setLabel('下一个 ->')
                .setStyle('Primary'),
        );
    }

    return actionRow;
}

function buildQuestDeleteButtonRow(start, end, current) {
    const actionRow = new ActionRowBuilder();

    if (current != start) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('previousQuest')
                .setLabel('<- 前一个')
                .setStyle('Primary'),
        );
    }

    actionRow.addComponents(
        new ButtonBuilder()
            .setCustomId('deleteQuest')
            .setLabel('❌ 删除任务')
            .setStyle('Danger'),
    );

    if (current != end) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('nextQuest')
                .setLabel('下一个 ->')
                .setStyle('Primary'),
        );
    }

    return actionRow;
}

module.exports = {
    buildQuestInfoButtonRow,
    buildQuestDeleteButtonRow,
    buildQuestReviewButtonRow,
};
