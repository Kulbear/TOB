const {
    Quest,
} = require('../models/quest.js');
const {
    botErrorReply,
} = require('./guildMessages.js');

const {
    missionAdminRoleID,
} = require('../botConfig.json');


function getCurrentTime() {
    return new Date();
}

async function onPublishQuestModalSubmit(interaction, supabase) {
    console.debug('[INFO] onSubmitQuestModalSubmit called!');
    const questNameDescription = interaction.fields.getTextInputValue('questDescriptionInput');
    const questDuration = interaction.fields.getTextInputValue('questDurationInput');
    const questReward = interaction.fields.getTextInputValue('questRewardInput');
    const questMultipleTaker = interaction.fields.getTextInputValue('questMultipleTakerInput');
    const questRepeatable = interaction.fields.getTextInputValue('questRepeatableInput');
    const submitter = interaction.user.id;

    console.debug(`[DEBUG] User ${interaction.user.id} is submitting a new quest.`);
    const questToSubmit = new Quest();
    questToSubmit.intializeQuest();
    // in questNameDescription, first line is quest name and the rest lines are quest description
    const questNameDescriptionArray = questNameDescription.split('\n');
    const questName = questNameDescriptionArray[0];
    const questDescription = questNameDescriptionArray.slice(1).join('\n');
    questToSubmit.setName(questName);
    questToSubmit.setDescription(questDescription);
    questToSubmit.setRewardText(questReward);
    questToSubmit.setMultipletakers(questMultipleTaker == 1 ? true : false);
    questToSubmit.setRepeatable(questRepeatable == 1 ? true : false);
    questToSubmit.setCreatedBy(submitter);
    questToSubmit.setDurationTextRaw(questDuration);
    questToSubmit.setCreatedAt(getCurrentTime());
    // force update
    questToSubmit.updateQuestStatus();
    if (interaction.member.roles.cache.has(missionAdminRoleID) || interaction.user.id == '1191572677165588538') {
        questToSubmit.updateQuestStatus({ adminUpdate: true });
    }
    else {
        questToSubmit.updateQuestStatus();
    }

    const newQuestData = questToSubmit.returnAttributeToStore();
    if (questToSubmit.fromAdmin) {
        supabase.from('Quest').insert(newQuestData)
            .then((res) => {
                console.debug(res);
                if (res.error === null) {
                    console.debug(`[DEBUG] Quest ${questToSubmit.questId} has been submitted by ${interaction.user.id}.\nQuest Data: ${JSON.stringify(newQuestData)}`);
                    if (questToSubmit.fromAdmin) {
                        interaction.reply({
                            content: '你的任务已经发布成功！可在任务列表中查看',
                            ephemeral: true,
                        // embeds: [buildQuestPublishEmbed(interaction, questToSubmit)],
                        });
                    }
                }
                else {
                    console.debug(JSON.stringify(res.error));
                    botErrorReply(interaction);
                }
            });
    }
    else {
        interaction.reply({
            content: '该指令目前仅支持管理员使用！',
            ephemeral: true,
        });
    }
}

module.exports = {
    onPublishQuestModalSubmit,
};
