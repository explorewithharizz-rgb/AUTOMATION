import { Platform } from "@/types";
import { SocialProvider } from "./types";
import { youtubeProvider } from "./youtube";
import { metaProvider } from "./meta";
import { snapchatProvider } from "./snapchat";
import { shareChatProvider } from "./sharechat";

export * from "./types";
export { youtubeProvider } from "./youtube";
export { metaProvider } from "./meta";
export { snapchatProvider } from "./snapchat";
export { shareChatProvider } from "./sharechat";

const providers: Record<string, SocialProvider> = {
  youtube: youtubeProvider,
  meta: metaProvider,
  facebook: metaProvider,
  instagram: metaProvider,
  snapchat: snapchatProvider,
  sharechat: shareChatProvider,
};

export function getProvider(platform: Platform | "meta"): SocialProvider | undefined {
  return providers[platform];
}

export function getAllProviders(): SocialProvider[] {
  return [youtubeProvider, metaProvider, snapchatProvider, shareChatProvider];
}
