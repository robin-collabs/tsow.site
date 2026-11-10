import { createFileRoute } from "@tanstack/react-router";
import { SimulatorApp } from "@/components/sim/SimulatorApp";

export const Route = createFileRoute("/")({
  // The simulator draws on a canvas and reads browser APIs; render it only in the browser.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Chennai Traffic Simulator — autonomous vehicles on real OSM roads" },
      {
        name: "description",
        content:
          "Browser-based autonomous traffic simulation of cars, bikes, autos and trucks on real OpenStreetMap roads from Chennai Central to Injambakkam.",
      },
      { property: "og:title", content: "Chennai Traffic Simulator" },
      {
        property: "og:description",
        content:
          "Watch cars, bikes, auto rickshaws and trucks drive themselves on real Chennai roads, right in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimulatorApp,
});
