import { config } from "#root/config";
import { Api, RawApi } from "grammy";
import { DocumentType } from "@typegoose/typegoose";
import { TranslationVariables } from "@grammyjs/i18n";
import { logger } from "#root/logger";
import { User, countUsers, findQueue, placeInLine } from "../models/user";
import { getRandomCoolEmoji, toEmoji } from "./emoji";
import { bigIntWithCustomSeparator } from "./numbers";
import { i18n } from "../i18n";

export function adminIndex(userId: number): number {
  if (!config.BOT_ADMINS.includes(userId)) {
    throw new Error("Not admin");
  }
  return config.BOT_ADMINS.indexOf(userId);
}

export async function sendMessageToAdmins(api: Api<RawApi>, message: string) {
  // eslint-disable-next-line no-restricted-syntax
  for (const adminId of config.BOT_ADMINS) {
    // eslint-disable-next-line no-await-in-loop
    await api.sendMessage(adminId, message);
  }
}

export function inviteTelegramUrl(userId: number) {
  return `https://t.me/${config.BOT_NAME}?start=${userId}`;
}

export function shareTelegramLink(userId: number, text: string): string {
  const url = inviteTelegramUrl(userId);
  return `https://t.me/share/url?url=${encodeURI(url)}&text=${encodeURIComponent(text)}`;
}

export async function sendPlaceInLine(
  api: Api<RawApi>,
  user: DocumentType<User>,
  sendAnyway = true,
): Promise<boolean> {
  const place = await placeInLine(user.votes);
  const totalPlaces = await countUsers(false);
  const lastSendedPlace = user.lastSendedPlace ?? Number.MAX_SAFE_INTEGER;
  const placeDecreased = place < lastSendedPlace;
  if (sendAnyway || placeDecreased) {
    const inviteLink = inviteTelegramUrl(user.id);
    const shareLink = shareTelegramLink(
      user.id,
      i18n.t(user.language, "mint.share"),
    );
    const titleKey = `speedup.${user.minted ? "title_minted" : "title_not_minted"}`;
    const titleVariables: TranslationVariables<string> = user.minted
      ? {
          points: bigIntWithCustomSeparator(user.votes),
        }
      : {
          place: toEmoji(place),
          total: toEmoji(totalPlaces),
        };
    await api.sendMessage(
      user.id,
      `${i18n.t(user.language, titleKey, titleVariables)}

${i18n.t(user.language, "speedup.variants", {
  shareLink,
  inviteLink,
  collectionOwner: config.COLLECTION_OWNER,
})}`,
    );
    // eslint-disable-next-line no-param-reassign
    user.lastSendedPlace = place;
    await user.save();
    logger.info(`Points ${user.votes} for user ${user.id}`);
    return true;
  }
  return false;
}

export async function sendNewPlaces(api: Api<RawApi>) {
  const users = await findQueue();
  // eslint-disable-next-line no-restricted-syntax
  for (const user of users) {
    // eslint-disable-next-line no-await-in-loop
    await sendPlaceInLine(api, user, false);
  }
}

export async function sendNewNFTMessage(
  api: Api<RawApi>,
  ipfsImageHash: string,
  number: number,
  nftUrl: string,
) {
  const chats = { ru: "@viz_blockchain", en: "@viz_blockchain" };
  // eslint-disable-next-line no-restricted-syntax
  for (const [lang, chat] of Object.entries(chats)) {
    const collection = "cubeworlds";
    const collectionLink = `<a href="https://getgems.io/${collection}?utm_campaign=${collection}&utm_source=inline&utm_medium=collection">Cube Worlds</a>`;
    const emoji1 = getRandomCoolEmoji();
    const emoji2 = getRandomCoolEmoji();
    const caption = i18n.t(lang, "queue.new_nft", {
      emoji1,
      emoji2,
      number,
      collectionLink,
    });
    const linkTitle = i18n.t(lang, "queue.new_nft_button");
    // eslint-disable-next-line no-await-in-loop
    await api.sendPhoto(chat, `https://ipfs.io/ipfs/${ipfsImageHash}`, {
      caption,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: linkTitle,
              url: `${nftUrl}?utm_campaign=${collection}&utm_source=inline&utm_medium=nft`,
            },
          ],
        ],
      },
    });
  }
}
