import { describe, expect, it } from "vitest";
import { getValidationWsUrl } from "./urls";

describe("getValidationWsUrl", () => {
  it("reemplaza el comodín IPv4 por un host conectable", () => {
    const url = getValidationWsUrl(121124, "ws://0.0.0.0:4001");

    expect(url).not.toBeNull();
    expect(url).not.toContain("0.0.0.0");
    expect(url).toMatch(/^ws:\/\/[^/]+:4001\/ws\/121124$/);
  });

  it("reemplaza el comodín IPv6 por un host conectable", () => {
    const url = getValidationWsUrl("abc", "ws://[::]:4001");

    expect(url).not.toBeNull();
    expect(url).not.toContain("[::]");
    expect(url).toMatch(/^ws:\/\/[^/]+:4001\/ws\/abc$/);
  });

  it("normaliza http a ws y elimina la barra final", () => {
    expect(
      getValidationWsUrl("abc", "http://api.example.com:4001/")
    ).toBe("ws://api.example.com:4001/ws/abc");
  });

  it("normaliza https a wss", () => {
    expect(
      getValidationWsUrl("abc", "https://api.example.com")
    ).toBe("wss://api.example.com/ws/abc");
  });

  it("codifica el identificador", () => {
    expect(
      getValidationWsUrl("tramite/123 456", "ws://127.0.0.1:4001")
    ).toBe("ws://127.0.0.1:4001/ws/tramite%2F123%20456");
  });

  it("devuelve null cuando no hay identificador", () => {
    expect(getValidationWsUrl(null, "ws://127.0.0.1:4001")).toBeNull();
    expect(getValidationWsUrl(undefined, "ws://127.0.0.1:4001")).toBeNull();
    expect(getValidationWsUrl("   ", "ws://127.0.0.1:4001")).toBeNull();
  });

  it("acepta el identificador 0 como válido", () => {
    expect(getValidationWsUrl(0, "ws://127.0.0.1:4001")).toBe(
      "ws://127.0.0.1:4001/ws/0"
    );
  });
});
