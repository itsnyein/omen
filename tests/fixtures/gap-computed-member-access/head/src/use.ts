import { Client } from "./client.js";

export function viaConstant(client: Client): string {
  const key = "send" as const;
  return client[key]("a");
}

export function viaParentheses(client: Client): string {
  return client[("send")]("b");
}

export function viaVariable(client: Client, key: "send"): string {
  return client[key]("c");
}

export function viaUnknownKey(bag: Record<string, (v: string) => string>, key: string): string {
  return bag[key]("d");
}
