import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { isAdmin } from "#root/bot/filters/is-admin.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("positive", logHandle("command-propmpts"), async (ctx) => {
  const oldPositivePrompt = ctx.dbuser.positivePrompt;
  const newPositivePrompt = ctx.match;
  if (newPositivePrompt.trim()) {
    ctx.dbuser.positivePrompt = newPositivePrompt;
    await ctx.dbuser.save();
    await ctx.reply(`<code>/positive ${ctx.dbuser.positivePrompt}</code>`);
    return;
  }
  await ctx.reply(`<code>/positive ${oldPositivePrompt}</code>`);
});

feature.command("negative", logHandle("command-propmpts"), async (ctx) => {
  const oldNegativePrompt = ctx.dbuser.negativePrompt;
  const newNegativePrompt = ctx.match;
  if (newNegativePrompt.trim()) {
    ctx.dbuser.negativePrompt = newNegativePrompt;
    await ctx.dbuser.save();
    await ctx.reply(`<code>/negative ${ctx.dbuser.negativePrompt}</code>`);
    return;
  }
  await ctx.reply(`<code>/negative ${oldNegativePrompt}</code>`);
});

feature.command("strength", logHandle("command-strength"), async (ctx) => {
  const oldStrength = ctx.dbuser.strength ?? 0.35;
  const newStrength = Number.parseFloat(ctx.match.trim());
  if (newStrength && !Number.isNaN(newStrength)) {
    if (newStrength < 0 || newStrength > 1) {
      return ctx.reply("New strength value MUST be between 0 and 1");
    }
    ctx.dbuser.strength = newStrength;
    await ctx.dbuser.save();
    return ctx.reply(`New strength: <code>/strength ${newStrength}</code>`);
  }
  return ctx.reply(
    `Current strength: <code>/strength ${oldStrength}</code>. Can be in range [ 0 .. 1 ]`,
  );
});

feature.command("scale", logHandle("command-scale"), async (ctx) => {
  const oldScale = ctx.dbuser.scale ?? 7;
  const newScale = Number.parseInt(ctx.match.trim(), 10);
  if (newScale && !Number.isNaN(newScale)) {
    if (newScale < 0 || newScale > 35) {
      return ctx.reply("New scale value MUST be between 0 and 35");
    }
    ctx.dbuser.scale = newScale;
    await ctx.dbuser.save();
    return ctx.reply(`New scale: <code>/scale ${newScale}</code>`);
  }
  return ctx.reply(
    `Current scale: <code>/scale ${oldScale}</code>. Can be in range [0 .. 35]`,
  );
});

feature.command("steps", logHandle("command-steps"), async (ctx) => {
  const oldSteps = ctx.dbuser.strength ?? 30;
  const newSteps = Number.parseInt(ctx.match.trim(), 10);
  if (newSteps && !Number.isNaN(newSteps)) {
    if (newSteps < 10 || newSteps > 50) {
      return ctx.reply("New steps value MUST be between 10 and 50");
    }
    ctx.dbuser.steps = newSteps;
    await ctx.dbuser.save();
    return ctx.reply(`New steps: <code>/steps ${newSteps}</code>`);
  }
  return ctx.reply(
    `Current steps: <code>/steps ${oldSteps}</code>. Can be in range [ 10 .. 50 ]`,
  );
});

export { composer as parametersFeature };
