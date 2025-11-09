import { SlashCommandBuilder } from '@discordjs/builders';
import Stock from '../models/Stock.js';
import Config from '../models/Config.js';
import AuditLog from '../models/AuditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verifylisting')
    .setDescription('Verify a listing (admin only)')
    .addStringOption(o => o.setName('ticker').setRequired(true)),
  async execute(interaction) {
    const ticker = interaction.options.getString('ticker').toUpperCase();
    const cfg = await Config.findOne({}) || {};
    const isOwner = interaction.user.id === (cfg.ownerId || process.env.OWNER_ID);
    const isAdmin = cfg.adminRoleId && interaction.member.roles.cache.has(cfg.adminRoleId);
    if (!isAdmin && !isOwner) return interaction.reply({ content: 'Only owner/admin can verify', ephemeral: true });

    const stock = await Stock.findOne({ ticker });
    if (!stock) return interaction.reply({ content: 'Not found', ephemeral: true });
    if (stock.verified) return interaction.reply({ content: 'Already verified', ephemeral: true });

    stock.verified = true; await stock.save();
    await AuditLog.create({ type: 'verify', userId: stock.ownerId, stockTicker: ticker, details: {}, reason: 'verified', by: interaction.user.id });
    return interaction.reply({ content: `✅ ${stock.commonName} (${ticker}) verified.`, ephemeral: false });
  }
};
