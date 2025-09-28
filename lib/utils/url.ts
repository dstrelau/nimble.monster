import { slugify } from "./slug";

export function getBaseUrl(request?: Request): string {
  if (request) {
    const host = request.headers.get("host");
    if (host) {
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      return `${protocol}://${host}`;
    }
  }

  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

// Monster URLs
export function getMonsterUrl(monster: { name: string; id: string }): string {
  return `/monsters/${slugify(monster)}`;
}

export function getMonsterEditUrl(monster: {
  name: string;
  id: string;
}): string {
  return `/monsters/${slugify(monster)}/edit`;
}

export function getMonsterImageUrl(monster: {
  name: string;
  id: string;
}): string {
  return `/monsters/${slugify(monster)}/image`;
}

// Item URLs
export function getItemUrl(item: { name: string; id: string }): string {
  return `/items/${slugify(item)}`;
}

export function getItemEditUrl(item: { name: string; id: string }): string {
  return `/items/${slugify(item)}/edit`;
}

export function getItemImageUrl(item: { name: string; id: string }): string {
  return `/items/${slugify(item)}/image`;
}

// Companion URLs
export function getCompanionUrl(companion: {
  id: string;
  name: string;
}): string {
  return `/companions/${slugify(companion)}`;
}

export function getCompanionEditUrl(companion: {
  id: string;
  name: string;
}): string {
  return `/companions/${slugify(companion)}/edit`;
}

export function getCompanionImageUrl(companion: {
  id: string;
  name: string;
}): string {
  return `/companions/${slugify(companion)}/image`;
}

// Collection URLs
export function getCollectionUrl(collection: {
  name: string;
  id: string;
}): string {
  return `/collections/${slugify(collection)}`;
}

export function getCollectionEditUrl(collection: {
  name: string;
  id: string;
}): string {
  return `/collections/${slugify(collection)}/edit`;
}

export function getCollectionDownloadUrl(collection: { id: string }): string {
  return `/api/collections/${collection.id}/download`;
}

// Family URLs
export function getFamilyUrl(family: { name: string; id: string }): string {
  return `/families/${slugify(family)}`;
}

export function getFamilyEditUrl(family: { name: string; id: string }): string {
  return `/families/${slugify(family)}/edit`;
}

// Subclass URLs
export function getSubclassSlug(subclass: {
  namePreface?: string;
  name: string;
  id: string;
}): string {
  return slugify({
    id: subclass.id,
    name: subclass.namePreface
      ? `${subclass.namePreface} ${subclass.name}`
      : subclass.name,
  });
}
export function getSubclassUrl(subclass: {
  namePreface?: string;
  name: string;
  id: string;
}): string {
  return `/subclasses/${getSubclassSlug(subclass)}`;
}

export function getSubclassEditUrl(subclass: {
  namePreface?: string;
  name: string;
  id: string;
}): string {
  return `${getSubclassUrl(subclass)}/edit`;
}

// User URLs
export function getUserUrl(user: { username: string }): string {
  return `/u/${user.username}`;
}
