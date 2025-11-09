import { SlashCommandBuilder } from '@discordjs/builders';
import Stock from '../models/Stock.js';
import Config from '../models/Config.js';
import AuditLog from '../models/AuditLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin actions')
    .addSubcommand(sc => sc.setName('rename').setDescription('Rename stock').addStringOption(o => o.setName('ticker').setRequired(true)).addStringOption(o => o.setName('newcommon').setRequired(true)).addStringOption(o => o.setName('newticker')))
    .addSubcommand(sc => sc.setName('delete').setDescription('Delete stock').addStringOption(o => o.setName('ticker').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const cfg = await Config.findOne({}) || {};
    const isOwner = interaction.user.id === (cfg.ownerId || process.env.OWNER_ID);
    const isAdmin = cfg.adminRoleId && interaction.member.roles.cache.has(cfg.adminRoleId);
    if (!isAdmin && !isOwner) return interaction.reply({ content: 'Only owner/admins allowed', ephemeral: true });

    if (sub === 'rename') {
      const ticker = interaction.options.getString('ticker').toUpperCase();
      const newCommon = interaction.options.getString('newcommon').trim();
      const newTicker = interaction.options.getString('newticker')?.toUpperCase();
      const stock = await Stock.findOne({ ticker });
      if (!stock) return interaction.reply({ content: 'Stock not found', ephemeral: true });

      stock.oldNames = stock.oldNames || [];
      stock.oldNames.push(stock.commonName);
      stock.commonName = newCommon;
      if (newTicker) {
        const exists = await Stock.findOne({ ticker: newTicker });
        if (exists) return interaction.reply({ content: 'Ticker exists', ephemeral: true });
        stock.ticker = newTicker;
      }
      await stock.save();
      await AuditLog.create({ type: 'rename', userId: stock.ownerId, stockTicker: stock.ticker, details: { newCommon, newTicker }, reason: 'admin rename', by: interaction.user.id });
      return interaction.reply({ content: `✅ Renamed to ${stock.commonName} (${stock.ticker})` });
    }

    if (sub === 'delete') {
      const ticker = interaction.options.getString('ticker').toUpperCase();
      const stock = await Stock.findOne({ ticker });
      if (!stock) return interaction.reply({ content: 'Stock not found', ephemeral: true });
      await Stock.deleteOne({ ticker });
      await AuditLog.create({ type: 'delete', userId: stock.ownerId, stockTicker: ticker, details: {}, reason: 'admin delete', by: interaction.user.id });
      return interaction.reply({ content: `✅ ${ticker} deleted.` });
    }
  }
};
