const width = window.innerWidth * 0.7;
const height = window.innerHeight;

const svg = d3.select("#map")
  .attr("width", width)
  .attr("height", height);

const projection = d3.geoMercator()
  .center([-77.0369, 38.9072])
  .scale(1)
  .translate([0,0]);

const path = d3.geoPath().projection(projection);

// Color schemes for each indicator
const indicatorColors = {
  "m5_4_bike_lanes": d3.interpolateOranges,
  "m8_2_parks": d3.interpolateBlues,
  "m8_1_urban_tree_canopy": d3.interpolateGreens,
  "m8_3_trails": d3.interpolatePurples
};

// Indicator titles for display
const indicatorTitles = {
  "m5_4_bike_lanes": "Bike Lanes",
  "m8_2_parks": "Parks",
  "m8_1_urban_tree_canopy": "Urban Tree Canopy",
  "m8_3_trails": "Trails"
};

// Load GeoJSON
d3.json("data/dc.geojson").then(geojson => {

  projection.fitSize([width, height], geojson);

  // Start with blank map
  svg.selectAll("path")
    .data(geojson.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#ccc")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5);

  // --- SCROLLAMA SETUP ---
  const scroller = scrollama();
  scroller
    .setup({
      step: ".step",
      offset: 0.5,
      debug: false
    })
    .onStepEnter((response) => {
      const indicator = response.element.getAttribute("data-indicator");
      if (indicator) {
        updateMap(indicator);
      } else {
        // Reset to base map when scrolling back to intro
        resetMap();
      }
    });

  window.addEventListener("resize", () => scroller.resize());

  // --- RESET MAP ---
  function resetMap(){
    svg.selectAll("path")
      .transition().duration(500)
      .attr("fill", "#ccc");
    
    d3.select("#legend").html("");
    
    // Hide map title
    const mapTitle = d3.select("#map-title");
    mapTitle.classed("visible", false);
  }

  // --- UPDATE MAP ---
  function updateMap(indicator){
    const values = geojson.features
      .map(f => f.properties[indicator])
      .filter(v => !isNaN(v));

    const color = d3.scaleQuantize()
      .domain(d3.extent(values))
      .range(d3.quantize(indicatorColors[indicator], 7));

    svg.selectAll("path")
      .data(geojson.features)
      .join("path")
      .transition().duration(500)
      .attr("d", path)
      .attr("fill", d => {
        const v = d.properties[indicator];
        return (v !== undefined && !isNaN(v)) ? color(v) : "#ccc";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5);

    drawLegend(color);
    
    // Show map title
    const mapTitle = d3.select("#map-title");
    mapTitle.text(indicatorTitles[indicator]);
    mapTitle.classed("visible", true);
  }

  // --- DRAW LEGEND ---
  function drawLegend(color){
    const legend = d3.select("#legend");
    legend.html("");

    const [min,max] = color.domain();
    const steps = color.range().length;
    const step = (max-min)/steps;

    legend.append("div").text("Percentile");

    color.range().forEach((c,i) => {
      const rangeMin = (min + i*step);
      const rangeMax = (i === steps-1) ? max : (min + (i+1)*step);
      legend.append("div")
        .style("display","flex")
        .style("align-items","center")
        .html(`<div style="width:20px;height:20px;background:${c};margin-right:5px;"></div> ${rangeMin.toFixed(1)} – ${rangeMax.toFixed(1)}`);
    });
  }

});