import type { Context } from "#root/bot/context.js";
import { PhotoSize } from "@grammyjs/types";

export async function getUserProfilePhoto(
  ctx: Context,
  userId: number,
  avatarNumber: number = 0,
): Promise<PhotoSize> {
  const photos = await ctx.api.getUserProfilePhotos(userId);
  ctx.logger.debug(photos);
  if (photos.total_count > 0) {
    const lastPhotoArray = photos.photos[avatarNumber % photos.photos.length];
    const photo = lastPhotoArray?.sort(
      (a, b) => (b.file_size ?? 0) - (a.file_size ?? 0),
    )[0];
    return photo;
  }
  throw new Error("Zero count photos");
}

export async function getUserProfileFile(
  ctx: Context,
  userId: number,
  avatarNumber: number,
) {
  const photo = await getUserProfilePhoto(ctx, userId, avatarNumber);
  if (photo) {
    return ctx.api.getFile(photo.file_id);
  }
}
