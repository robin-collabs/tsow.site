import { describe, expect, it } from "vitest";
import { trafficLevel } from "@/simulation/traffic";

describe("route traffic colour", () => {
  it("is blue above 70% of the speed limit", () => expect(trafficLevel(8, 10)).toBe(0));
  it("is amber between 30% and 70%", () => expect(trafficLevel(5, 10)).toBe(1));
  it("is red below 30%", () => expect(trafficLevel(2, 10)).toBe(2));
  it("is blue on empty roads", () => expect(trafficLevel(null, 10)).toBe(0));
});
