import { SlashCommandBuilder } from '@discordjs/builders';
import Config from '../models/Config.js';
import Stock from '../models/Stock.js';
import AuditLog from '../models/AuditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('advisor')
    .setDescription('Advisor commands')
    .addSubcommand(sc => sc.setName('watch').addStringOption(o => o.setName('ticker').setRequired(true)))
    .addSubcommand(sc => sc.setName('analysis').addStringOption(o => o.setName('ticker').setRequired(true)).addStringOption(o => o.setName('note').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const cfg = await Config.findOne({}) || {};
    const isAdvisor = cfg.advisorRoleId && interaction.member.roles.cache.has(cfg.advisorRoleId);
    if (!isAdvisor && interaction.user.id !== (cfg.ownerId || process.env.OWNER_ID)) return interaction.reply({ content: 'Only advisor or owner', ephemeral: true });

    if (sub === 'watch') {
      const ticker = interaction.options.getString('ticker').toUpperCase();
      return interaction.reply({ content: `You are now watching ${ticker} (placeholder)`, ephemeral: true });
    }
    if (sub === 'analysis') {
      const ticker = interaction.options.getString('ticker').toUpperCase();
      const note = interaction.options.getString('note');
      await AuditLog.create({ type: 'advisor_note', userId: interaction.user.id, stockTicker: ticker, details: { note }, by: interaction.user.id });
      return interaction.reply({ content: `📣 Analysis for ${ticker}: "${note}"`, ephemeral: false });
    }
  }
};
