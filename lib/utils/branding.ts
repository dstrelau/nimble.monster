export function getSiteName(hostname?: string): string {
  if (!hostname) {
    return "Nimble Nexus";
  }

  if (hostname.includes("nimble.monster")) {
    return "nimble.monster";
  }

  return "Nimble Nexus";
}

export function getSiteEmail(hostname?: string): string {
  if (!hostname) {
    return "hello@nimble.nexus";
  }

  if (hostname.includes("nimble.monster")) {
    return "hello@nimble.monster";
  }

  return "hello@nimble.nexus";
}
