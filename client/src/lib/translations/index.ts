// ---------------------------------------------------------------------------
// Translation registry
//
// Each namespace lives in its own file and exports { no, en } maps with
// identical keys. Look up strings as "namespace.key" via t() from
// @/lib/i18n. Norwegian is the source of truth: a key missing in English
// falls back to Norwegian, then to the key itself.
// ---------------------------------------------------------------------------

import { common } from "./common";
import { nav } from "./nav";
import { home } from "./home";
import { listing } from "./listing";
import { forms } from "./forms";
import { auth } from "./auth";
import { chat } from "./chat";
import { profile } from "./profile";
import { reviews } from "./reviews";
import { saved } from "./saved";
import { admin } from "./admin";
import { pages } from "./pages";

export type Lang = "no" | "en";

export type Namespace = {
  no: Record<string, string>;
  en: Record<string, string>;
};

export const dictionaries: Record<string, Namespace> = {
  common,
  nav,
  home,
  listing,
  forms,
  auth,
  chat,
  profile,
  reviews,
  saved,
  admin,
  pages,
};
