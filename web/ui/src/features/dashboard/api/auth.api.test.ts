import { describe, vi, it, expect } from "vitest";
import { UserApiClient } from "./auth.api";

vi.mock("@services/api/client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe("UserApiClient", () => {
  it("should be defined", () => {
    const client = new UserApiClient();
    expect(client).toBeDefined();
  });
});
