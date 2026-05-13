const layers = {
  trust: {
    title: "Trust and social confidence",
    kicker: "Selected layer",
    summary:
      "Regional differences become clearer when the map is paired with short interpretive notes and source transparency.",
    year: "2026",
    palette: [74, 42, 61, 88, 55, 37, 69, 80, 49],
  },
  migration: {
    title: "Mobility routes and reception",
    kicker: "Comparative layer",
    summary:
      "Movement patterns can be read beside institutional capacity, local memory, and public attitude indicators.",
    year: "2025",
    palette: [45, 77, 84, 51, 68, 59, 92, 40, 73],
  },
  memory: {
    title: "Historical memory clusters",
    kicker: "Archive layer",
    summary:
      "Archive fragments, regional timelines, and cultural references can become a navigable public research object.",
    year: "2024",
    palette: [81, 64, 39, 72, 90, 48, 57, 71, 53],
  },
  institutions: {
    title: "Institutional confidence gaps",
    kicker: "Survey layer",
    summary:
      "Confidence indicators are most useful when uncertainty, wording, and comparison limits stay visible.",
    year: "2026",
    palette: [58, 51, 76, 63, 45, 82, 70, 66, 87],
  },
};

const tabs = document.querySelectorAll(".layer-tab");
const regions = document.querySelectorAll(".region");
const title = document.querySelector("#map-title");
const kicker = document.querySelector("#map-kicker");
const summary = document.querySelector("#map-summary");
const year = document.querySelector("#active-year");

function setLayer(layerName) {
  const layer = layers[layerName];
  if (!layer) return;

  title.textContent = layer.title;
  kicker.textContent = layer.kicker;
  summary.textContent = layer.summary;
  year.textContent = layer.year;

  regions.forEach((region, index) => {
    region.style.setProperty("--score", layer.palette[index]);
  });

  tabs.forEach((tab) => {
    const selected = tab.dataset.layer === layerName;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setLayer(tab.dataset.layer));
});
