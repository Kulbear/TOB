const {
    Quest,
    QuestInstance,
} = require('../models/quest.js');

const {
    ExpModLog,
} = require('../models/log.js');

const {
    botErrorReply,
    sendMessageToChannel,
} = require('./guildMessages.js');

const {
    buildApproveCompletionModal,
} = require('./modalUtils.js');
const {
    missionAdminRoleID,
    missionBroadcastChannel,
} = require('../botConfig.json');

const {
    buildQuestListInfoEmbed,
    buildQuestReviewListInfoEmbed,
} = require('./embeds.js');

const {
    buildQuestInfoButtonRow,
    buildQuestDeleteButtonRow,
    buildQuestReviewButtonRow,
} = require('./componentUtils.js');


function getCurrentTime() {
    return new Date();
}

async function onQuestInstanceInfoButtonClick(interaction, supabase) {
    const questId = interaction.message.embeds[0].fields[0].value;
    const questIdx = parseInt(interaction.message.embeds[0].fields[2].value);
    const questSubmitter = interaction.message.embeds[0].fields[1].value;
    // questSubmitter is something like <@123>, we need to remove <@ and > to get the id
    const questSubmitterId = questSubmitter.replace('<@', '').replace('>', '');

    console.log(questId, questIdx, questSubmitter);
    // const client = interaction.client;
    const guild = interaction.guild;
    // get quest list from the database
    supabase.from('QuestInstance').select('*').eq('completion', false).eq('needReview', true)
        .then((res) => {
            if (res.error !== null) {
                botErrorReply(interaction);
            }
            else {
                return res['data'];
            }
        })
        .then((data) => {
            if (data && data.length > 0) {
                const availableQuestData = data;
                if (interaction.customId === 'approveCompletion') {
                    supabase.from('QuestInstance').update({ 'completion': true, 'needReview': false }).eq('questId', questId).eq('dcId', questSubmitterId)
                        .then((res) => {
                            if (res.error !== null) {
                                botErrorReply(interaction);
                            }
                            else {
                                // TODO: add buildApproveCompletionModal
                                const approveCompletionModal = buildApproveCompletionModal(questId, questSubmitterId);
                                interaction.showModal(approveCompletionModal);
                            }
                        });

                }
                else if (interaction.customId === 'rejectCompletion') {
                    console.log(questSubmitter, questId);
                    // TODO: not working update
                    supabase.from('QuestInstance').update({ 'completion': true, 'needReview': false }).eq('questId', questId).eq('dcId', questSubmitterId)
                        .then((res) => {
                            if (res.error !== null) {
                                botErrorReply(interaction);
                            }
                            console.log('QuestInstance rejectCompletion');
                        });
                    supabase.from('Player').update({ 'currentTaskId': null }).eq('dcId', questSubmitterId).eq('guildId', guild.id)
                        .then((res) => {
                            if (res.error !== null) {
                                botErrorReply(interaction);
                            }
                            console.log('Player rejectCompletion');
                        });
                    interaction.reply({
                        content: `${questSubmitter} 提交的任务 ${questId} 已经被驳回！`,
                        ephemeral: true,
                    });
                }
                else {
                    const isPrevious = interaction.customId === 'previousQuestReview';
                    if (isPrevious && questIdx === 1) {
                        interaction.reply({
                            content: 'This is the first quest in the list.',
                            ephemeral: true,
                        });
                        return;
                    }
                    else if (!isPrevious && questIdx === availableQuestData.length) {
                        interaction.reply({
                            content: 'This is the last quest in the list.',
                            ephemeral: true,
                        });
                        return;
                    }
                    const newQuestIdx = isPrevious ? questIdx - 1 : questIdx + 1;
                    const embed = buildQuestReviewListInfoEmbed(interaction, availableQuestData, newQuestIdx);
                    const actionRow = buildQuestReviewButtonRow(1, availableQuestData.length, newQuestIdx);

                    interaction.reply({
                        content: '下列是待审核的任务列表。 \n可通过点击下方按钮查看不同待审核任务。',
                        ephemeral: true,
                        embeds: [embed],
                        components: [actionRow],
                    });
                }
            }
        });

}


async function onQuestInfoButtonClick(interaction, supabase) {
    const questId = interaction.message.embeds[0].fields[2].value;
    const questIdx = parseInt(interaction.message.embeds[0].fields[3].value);

    const client = interaction.client;
    // get quest list from the database
    supabase.from('Quest').select('*').filter('expireAt', 'gte', JSON.stringify(new Date()))
        .then((res) => {
            if (res.error !== null) {
                botErrorReply(interaction);
            }
            else {
                return res['data'];
            }
        })
        .then((data) => {
            if (data && data.length > 0) {
                // TODO: multipletakers track
                const availableQuestData = data.filter((quest) => {
                    return quest['repeatable'] === true || (quest['repeatable'] === false && quest['acceptedBy'].length === 0);
                });
                if (interaction.customId === 'acceptQuest') {
                    // check if the user has current task
                    supabase.from('QuestInstance').select('*').eq('dcId', interaction.user.id).eq('completion', false)
                        .then((res) => {
                            if (res.error !== null) {
                                botErrorReply(interaction);
                            }
                            else {
                                return res['data'];
                            }
                        })
                        .then((data) => {
                            if (data && data.length > 0) {
                                interaction.reply({
                                    content: '你已经有一个任务在进行中了，请先完成或者放弃任务后再接受新的任务。',
                                    ephemeral: true,
                                });
                                return;
                            }
                            else {
                                const newQuestInstance = new QuestInstance(questId, interaction.user.id);
                                newQuestInstance.questAcceptAt();

                                const questInstanceData = newQuestInstance.returnAttributeToStore();
                                // create a new quest instance
                                supabase.from('QuestInstance').insert(questInstanceData)
                                    .then((res) => {
                                        console.log(res);
                                        if (res.error === null) {
                                            // also updated the quest acceptedBy
                                            supabase.from('Player').update(
                                                { 'currentTaskId': questId },
                                            ).eq('dcId', interaction.user.id)
                                                .then((res) => {
                                                    console.log(res);
                                                });
                                            sendMessageToChannel(
                                                client,
                                                missionBroadcastChannel,
                                                `<@${interaction.user.id}> 接受了任务【${questId}】！`,
                                            );
                                            interaction.reply({
                                                content: `任务 ${questId} 已经接受成功！`,
                                                ephemeral: true,
                                            });


                                        }
                                        else {
                                            interaction.reply({
                                                content: '接受任务出错，请联系管理员。',
                                                ephemeral: true,
                                            });
                                        }
                                    });

                            }
                        });
                }
                // TODO: not used at the moment
                else if (interaction.customId === 'deleteQuest') {
                    supabase.from('Quest').delete().eq('questId', questId)
                        .then((res) => {
                            if (res.error === null) {
                                return true;
                            }
                            else {
                                return false;
                            }
                        })
                        .then((success) => {
                            if (success) {
                                interaction.reply({
                                    content: `任务 ${questId} 已经删除成功！`,
                                    ephemeral: true,
                                });
                            }
                            else {
                                interaction.reply({
                                    content: '删除任务出错，请联系管理员。',
                                    ephemeral: true,
                                });
                            }
                        });

                }
                else {
                    const isPrevious = interaction.customId === 'previousQuest';
                    const ops = interaction.message.content.includes('删除') ? '删除' : '接受';
                    if (isPrevious && questIdx === 1) {
                        interaction.reply({
                            content: 'This is the first quest in the list.',
                            ephemeral: true,
                        });
                        return;
                    }
                    else if (!isPrevious && questIdx === (ops === '删除' ? data.length : availableQuestData.length)) {
                        interaction.reply({
                            content: 'This is the last quest in the list.',
                            ephemeral: true,
                        });
                        return;
                    }
                    const newQuestIdx = isPrevious ? questIdx - 1 : questIdx + 1;
                    // if message content contains "删除" then ops is 删除 otherwise is 接受
                    const embed = buildQuestListInfoEmbed(interaction, ops === '删除' ? data : availableQuestData, newQuestIdx, ops);
                    const actionRow = ops === '删除' ? buildQuestDeleteButtonRow(1, data.length, newQuestIdx) : buildQuestInfoButtonRow(1, availableQuestData.length, newQuestIdx);

                    interaction.reply({
                        content: `下列是可${ops === '删除' ? '删除' : '接受'}的任务列表。 \n可通过点击下方按钮查看不同任务。`,
                        ephemeral: true,
                        embeds: [embed],
                        components: [actionRow],
                    });
                }
            }
            else {
                interaction.reply({
                    content: '现在没有可接任务。',
                    ephemeral: true,
                });
            }
        });


}


async function onQuestApproveModalSubmit(interaction, supabase) {
    const questId = interaction.fields.getTextInputValue('questIdInput');
    const questSubmitter = interaction.fields.getTextInputValue('questSubmitterInput');
    const questReward = interaction.fields.getTextInputValue('questRewardInput');
    const questSubmitterId = questSubmitter.replace('<@', '').replace('>', '');
    const guild = interaction.guild;
    // constructor() {
    //     this.missionId = 0;
    //     this.expModAmt = 0;
    //     this.createdAt = new Date();
    //     this.updatedBy = null;
    //     this.note = null;
    //     this.targetPlayerId = null;
    //     this.targetPlayerDcId = null;
    // }

    const expLog = new ExpModLog();
    expLog.setMissionId(questId);
    expLog.setExpModAmt(parseInt(questReward));
    expLog.setUpdatedBy(interaction.user.id);
    expLog.setNote('任务完成奖励');
    expLog.setTargetPlayerId(questSubmitter);
    // TODO: expLog.setTargetPlayerDcId(?);


    // create expmodlog
    supabase.from('ExpModLog').insert(expLog.returnAttributeToStore())
        .then((res) => {
            // console.log(res);
            if (res.error !== null) {
                botErrorReply(interaction);
            }
            else {
                console.log('ExpModLog Inserted approveCompletion');
                // update quest instance
                supabase.from('QuestInstance').update({ 'completion': true, 'needReview': false }).eq('questId', questId).eq('dcId', questSubmitter)
                    .then((res) => {
                        if (res.error !== null) {
                            botErrorReply(interaction);
                        }
                        else {
                            console.log('QuestInstance approveCompletion');
                            // update player
                            supabase.from('Player').select('*').eq('dcId', questSubmitterId).eq('guildId', guild.id)
                                .then((res) => {
                                    // console.log(res);
                                    if (res.error !== null) {
                                        botErrorReply(interaction);
                                    }
                                    else {
                                        return res['data'];
                                    }
                                })
                                .then((data) => {
                                    console.log('Player approveCompletion', data);
                                    if (data && data.length > 0) {
                                        const player = data[0];
                                        // console.log(player['exp']);
                                        const newExp = player['exp'] + parseInt(questReward);
                                        // console.log(newExp);

                                        supabase.from('Player').update({ 'exp': newExp, 'currentTaskId': null }).eq('dcId', questSubmitterId).eq('guildId', guild.id)
                                            .then((res) => {
                                                if (res.error !== null) {
                                                    botErrorReply(interaction);
                                                }
                                                else {
                                                    console.log('Player approveCompletion');
                                                    interaction.reply({
                                                        content: `${questSubmitter} 提交的任务 ${questId} 已经被批准！\n奖励 ${questReward} 经验值！`,
                                                        ephemeral: true,
                                                    });
                                                }
                                            });
                                    }
                                });
                        }
                    });
            }
        });
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
    onQuestInfoButtonClick,
    onQuestInstanceInfoButtonClick,
    onQuestApproveModalSubmit,
};
