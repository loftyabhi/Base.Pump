// lib/tokensStore.ts
export type UserToken = { fid: number; token: string; url: string };

let userTokens: UserToken[] = [];

// Store or update tokens
export function addOrUpdateToken(fid: number, token: string, url: string) {
  const existing = userTokens.find((u) => u.fid === fid);
  if (existing) {
    existing.token = token;
    existing.url = url;
  } else {
    userTokens.push({ fid, token, url });
  }
}

// Remove token
export function removeToken(fid: number) {
  userTokens = userTokens.filter((u) => u.fid !== fid);
}

// Retrieve all tokens
export function getTokens(): UserToken[] {
  return userTokens;
}
