import { SlashCommandBuilder } from '@discordjs/builders';
import Config from '../models/Config.js';
import Suspension from '../models/Suspension.js';
import Stock from '../models/Stock.js';
import AuditLog from '../models/AuditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fbi')
    .setDescription('FBI moderator commands')
    .addSubcommand(sc => sc.setName('suspend-stock').addStringOption(o => o.setName('ticker').setRequired(true)).addStringOption(o => o.setName('reason')))
    .addSubcommand(sc => sc.setName('unsuspend-stock').addStringOption(o => o.setName('ticker').setRequired(true)))
    .addSubcommand(sc => sc.setName('view-logs').addStringOption(o => o.setName('ticker').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const cfg = await Config.findOne({}) || {};
    const isOwner = interaction.user.id === (cfg.ownerId || process.env.OWNER_ID);
    const isFBI = cfg.fbiRoleId && interaction.member.roles.cache.has(cfg.fbiRoleId);
    if (!isOwner && !isFBI) return interaction.reply({ content: 'Only FBI role or owner', ephemeral: true });

    if (sub === 'suspend-stock') {
      const ticker = interaction.options.getString('ticker').toUpperCase();
      const reason = interaction.options.getString('reason') || 'No reason';
      const stock = await Stock.findOne({ ticker });
      if (!stock) return interaction.reply({ content: 'Not found', ephemeral: true });
      stock.suspended = true; await stock.save();
      await Suspension.create({ target: ticker, type: 'stock', reason, by: interaction.user.id, active: true });
      await AuditLog.create({ type: 'suspend', userId: stock.ownerId, stockTicker: ticker, details: {}, reason, by: interaction.user.id });
      return interaction.reply({ content: `✅ ${ticker} suspended.` });
    }

    if (sub === 'unsuspend-stock') {
      const ticker = interaction.options.getString('ticker').toUpperCase();
      const stock = await Stock.findOne({ ticker });
      if (!stock) return interaction.reply({ content: 'Not found', ephemeral: true });
      stock.suspended = false; await stock.save();
      await Suspension.updateMany({ target: ticker, type: 'stock' }, { $set: { active: false } });
      await AuditLog.create({ type: 'unsuspend', userId: stock.ownerId, stockTicker: ticker, details: {}, reason: 'unsuspend', by: interaction.user.id });
      return interaction.reply({ content: `✅ ${ticker} unsuspended.` });
    }

    if (sub === 'view-logs') {
      const ticker = interaction.options.getString('ticker').toUpperCase();
      const logs = await AuditLog.find({ stockTicker: ticker }).sort({ timestamp: -1 }).limit(10);
      if (!logs.length) return interaction.reply({ content: 'No logs', ephemeral: true });
      let out = `Logs for ${ticker}:\n`;
      for (const l of logs) out += `• [${new Date(l.timestamp).toISOString()}] ${l.type} by ${l.by} - ${l.reason || ''}\n`;
      return interaction.reply({ content: out, ephemeral: true });
    }
  }
};
