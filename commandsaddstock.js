import { SlashCommandBuilder } from '@discordjs/builders';
import Stock from '../models/Stock.js';
import AuditLog from '../models/AuditLog.js';
import Config from '../models/Config.js';

function validTicker(ticker) {
  return /^[A-Z0-9]{2,4}$/.test(ticker);
}

export default {
  data: new SlashCommandBuilder()
    .setName('addstock')
    .setDescription('Create a new stock (owner pays listing fee externally)')
    .addStringOption(o => o.setName('commonname').setRequired(true))
    .addStringOption(o => o.setName('ticker').setRequired(true))
    .addStringOption(o => o.setName('universeid').setRequired(true))
    .addNumberOption(o => o.setName('baseprice').setRequired(true)),
  async execute(interaction) {
    const commonName = interaction.options.getString('commonname').trim();
    const ticker = interaction.options.getString('ticker').trim().toUpperCase();
    const universeId = interaction.options.getString('universeid').trim();
    const basePrice = interaction.options.getNumber('baseprice');

    if (commonName.length > 50) return interaction.reply({ content: 'Common name too long (50 max).', ephemeral: true });
    const cfg = await Config.findOne({}) || {};
    const isOwner = interaction.user.id === (cfg.ownerId || process.env.OWNER_ID);
    if (!isOwner && !validTicker(ticker)) return interaction.reply({ content: 'Ticker invalid: 2-4 uppercase letters/numbers.', ephemeral: true });

    const exists = await Stock.findOne({ ticker });
    if (exists) return interaction.reply({ content: 'Ticker already used.', ephemeral: true });

    const s = new Stock({ ownerId: interaction.user.id, universeId, commonName, ticker, basePrice, currentPrice: basePrice, verified: false });
    await s.save();
    await AuditLog.create({ type: 'addstock', userId: interaction.user.id, stockTicker: ticker, details: { commonName, universeId, basePrice }, reason: 'pending verification', by: interaction.user.id });

    return interaction.reply({ content: `Stock ${commonName} (${ticker}) created — pending verification. Ask admin to run /verifylisting ${ticker} after you buy the listing pass.`, ephemeral: true });
  }
};
