const margin = { top: 30, right: 50, bottom: 10, left: 300},
      width = 1000 - margin.left - margin.right,
      height =700 - margin.top - margin.bottom;
  
     

 d3.select("body")
   .style("background-color", "white");

const svg = d3.select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip");

svg.append("text")
  .attr("x", width / 2)
  .attr("y", -80)
  .attr("text-anchor", "middle")
  .style("font-size", "24px")
  .style("fill", "black")
  .style("font-weight", "bold")

svg.append("text")
  .attr("x", width / 2)
  .attr("y", -50)
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .style("fill", "#444")

svg.append("defs").append("filter")
  .attr("id", "glow")
  .append("feDropShadow")
  .attr("dx", 0)
  .attr("dy", 0)
  .attr("stdDeviation", 4)
  .attr("flood-color", "#FFD700");

const dimensions = ["budget", "Rating", "Votes", "netProfit"];
const allowedGenres = ["Action", "Comedy", "Drama", "Adventure", "Thriller", "Fantasy"];

const genreColor = d3.scaleOrdinal()
  .domain(allowedGenres)
  .range(["#ff6f61", "#6a5acd", "#20b2aa", "#ffa07a", "#3cb371", "#ff1493"]);

let fullData = [];

const files = [
  "pre_2014.csv", "pre_2015.csv", "pre_2016.csv","pre_2017.csv", "pre_2018.csv", "pre_2019.csv", "pre_2020.csv",
  "pre_2021.csv", "pre_2022.csv", "pre_2023.csv", "pre_2024.csv"
];

function mapGenre(rawGenre) {
  if (rawGenre.includes("Action") || rawGenre.includes("Superhero") || rawGenre.includes("Buddy Cop") || rawGenre.includes("Gun Fu") || rawGenre.includes("Action Epic")) return "Action";
  if (rawGenre.includes("Comedy")) return "Comedy";
  if (rawGenre.includes("Drama") || rawGenre.includes("Coming-of-Age")) return "Drama";
  if (rawGenre.includes("Adventure") || rawGenre.includes("Adventure Epic") || rawGenre.includes("Dinosaur Adventure")) return "Adventure";
  if (rawGenre.includes("Thriller") || rawGenre.includes("Suspense")) return "Thriller";
  if (rawGenre.includes("Fantasy") || rawGenre.includes("Computer Animation")) return "Fantasy";
  return "Other";
}

Promise.all(files.map(file => d3.csv(file))).then(allData => {
  fullData.forEach(d => {
    d.mainGenre = mapGenre(d.genres);
    d.Year = +d.Year;

    d.Votes = +d.Votes;
    d.budget = +d.budget;
    d.grossWorldWide = +d.grossWorldWide;
    d.netProfit = (isNaN(d.budget) || isNaN(d.grossWorldWide)) ? null : (+d.grossWorldWide - +d.budget) / 1e6;
  });
  

  fullData = fullData.filter(d =>
    allowedGenres.includes(d.mainGenre) &&
    !isNaN(d.Rating) &&
    !isNaN(d.Votes) &&
    !isNaN(d.budget) &&
    !isNaN(d.netProfit)
  );
  

  const yScales = {};
  dimensions.forEach(dim => {
    if (dim !== "mainGenre") {
      yScales[dim] = d3.scaleLinear()
        .domain(d3.extent(fullData, d => +d[dim]))
        .range([height, 0]);
    }
  });

  const xScale = d3.scalePoint()
    .domain(dimensions)
    .range([0, width]);

  dimensions.forEach(dim => {
    const axisGroup = svg.append("g")
      .attr("transform", `translate(${xScale(dim)},0)`);
  
 
      // dimensions.forEach(dim => {
      //   const axisGroup = svg.append("g")
      //     .attr("transform", `translate(${xScale(dim)},0)`);
      
        if (dim === "Rating") {
          // Axis on the right side for Rating
          axisGroup.call(d3.axisRight(yScales[dim]).tickFormat(d => d));
          axisGroup.attr("transform", `translate(${xScale(dim) + 5},0)`);
        } else if (dim !== "mainGenre") {
          axisGroup.call(d3.axisLeft(yScales[dim]).tickFormat(d => {
            if (dim === "budget" || dim === "netProfit") {
              if (d >= 1e3) return `$${(d / 1e3).toFixed(0)}B`;
              if (d >= 1) return `$${d.toFixed(0)}M`;
              return `$${(d * 1e3).toFixed(0)}K`;
            }
            return d;
          }));
        } else {
      const genreNames = allowedGenres;
      yScales[dim] = d3.scalePoint().domain(genreNames).range([height, 0]);
      axisGroup.call(d3.axisLeft(yScales[dim]));
    }

    //axisGroup.select("path.domain").remove();

    axisGroup.append("rect")
      .attr("x", -8)
      .attr("y", 0)
      .attr("width", 16)
      .attr("height", height)
      .attr("fill", "#1e1e2f")
      .attr("rx", 4)
      .attr("ry", 4);

    const holeHeight = 10;
    const holeSpacing = 20;
    for (let y = 0; y <= height; y += holeSpacing) {
      axisGroup.append("rect")
        .attr("x", -3.5)
        .attr("y", y)
        .attr("width", 7)
        .attr("height", holeHeight)
        .attr("fill", "#d3d3d3")
        .attr("rx", 2)
        .attr("ry", 2);
    }

    axisGroup.append("text")
      .style("text-anchor", "middle")
      .attr("y", -20)
      .html(() => {
        if (dim === "budget") return "💰";
        if (dim === "mainGenre") return "🎭";
        if (dim === "Rating") return "⭐";
        if (dim === "Votes") return "🗳️";
        if (dim === "netProfit") return "💵";
      })

    axisGroup.selectAll("text")
      .style("fill", "#222")
      .style("font-size", "15px");
  });
  
 

  const years = Array.from(new Set(fullData.map(d => +d.Year))).sort((a, b) => a - b);
  const yearDropdown = d3.select("#yearFilter");
  years.forEach(year => {
    yearDropdown.append("option")
      .attr("value", year)
      .text(year);
  });
  
  updateLines(fullData);

  function path(d) {
    return d3.line()(dimensions.map(dim => [xScale(dim), yScales[dim](d[dim])]));
  }

  function updateLines(filteredData) {
    svg.selectAll(".moviePath").remove();

    const selectedYear = +d3.select("#yearFilter").property("value");
    const yearData = fullData.filter(d => +d.Year === selectedYear);
    const topGrossTitles = yearData.sort((a, b) => +b.grossWorldWide - +a.grossWorldWide).slice(0, 5).map(d => d.Title);

    svg.selectAll(".moviePath")
      .data(filteredData)
      .enter()
      .append("path")
      .attr("class", d => (+d.oscars > 0) ? "moviePath glow" : "moviePath")
      .attr("d", path)
      .style("fill", "none")
      .style("stroke", d => {
        if (+d.oscars > 0) return "#FFD700";
        else if (topGrossTitles.includes(d.Title)) return "#FF8C00";
        else return genreColor(d.mainGenre);
      })
      .style("stroke-width", d => (+d.oscars > 0) ? 3.5 : (topGrossTitles.includes(d.Title) ? 3 : 1.2))
      .style("opacity", 0.6)
      .attr("stroke-dasharray", function() {
        const totalLength = this.getTotalLength();
        return totalLength + " " + totalLength;
      })
      .attr("stroke-dashoffset", function() {
        return this.getTotalLength();
      })
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .on("end", function(_, d) {
        d3.select(this)
          .on("mouseover", function(event, d) {
            d3.select(this).style("stroke-width", 5).style("opacity", 1);
            tooltip.transition().duration(200).style("opacity", .95);
            tooltip.html(`
              <strong>🎬 ${d.Title}</strong><br/>
              🎟️ MPA: ${d.MPA || "N/A"}<br/>
              💰 Budget: $${d.budget ? (+d.budget/1e6).toFixed(1) + "M" : " "}<br/>
        
              ⭐ Rating: ${d.Rating || "N/A"}<br/>
              📈 ROI: ${d.roi ? (+d.roi).toFixed(2) : "N/A"}<br/>
              🗳️ Votes: ${d.Votes ?(+d.Votes >= 1000 ? Math.round(d.Votes / 1000) + "K" : Math.round(d.Votes)) : "N/A"}<br/>
              💵 Net Profit: ${
                 d.netProfit
                   ? (d.netProfit >= 0
                       ? "<span style='color:green'> &#9650; $" + (d.netProfit >= 1000 ? (d.netProfit / 1000).toFixed(2) + "B" : d.netProfit.toFixed(2) + "M") + "</span>"
                       : "<span style='color:red'>&#9660; $" + Math.abs(d.netProfit).toFixed(2) + "M</span>")
                    : "N/A"
  }<br/> `
            )
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY - 20) + "px");
          })
          .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 20) + "px")
                   .style("top", (event.pageY - 20) + "px");
          })
          .on("mouseout", function(event, d) {
            d3.select(this)
              .style("stroke-width", (+d.oscars > 0) ? 3.5 : (topGrossTitles.includes(d.Title) ? 3 : 1.2))
              .style("opacity", 0.6);
            tooltip.transition().duration(500).style("opacity", 0);
          });
      });
  }

  function filterData() {
    let filtered = fullData;
    const selectedYear = +d3.select("#yearFilter").property("value");
    const selectedGenre = d3.select("#genreFilter").property("value");
    const topMetric = d3.select("#top20Filter").property("value");

    if (!isNaN(selectedYear)) filtered = filtered.filter(d => +d.Year === selectedYear);
    if (selectedGenre !== "All") filtered = filtered.filter(d => d.mainGenre === selectedGenre);
    if (topMetric !== "None") filtered = filtered.sort((a, b) => +b[topMetric] - +a[topMetric]).slice(0, 20);
    return filtered;
  }

  function applyFilter() {
    const newData = filterData();
    updateLines(newData);
  }

  d3.select("#yearFilter").on("change", applyFilter);
  d3.select("#genreFilter").on("change", applyFilter);
  d3.select("#top20Filter").on("change", applyFilter);

  d3.select("#oscarBtn").on("click", function() {
    const selectedYear = +d3.select("#yearFilter").property("value");
    const filtered = fullData.filter(d => +d.oscars > 0 && +d.Year === selectedYear);
    updateLines(filtered);
  });

  d3.select("#top5GrossBtn").on("click", function() {
    const selectedYear = +d3.select("#yearFilter").property("value");
    const yearData = fullData.filter(d => +d.Year === selectedYear);
    const top5 = yearData.sort((a, b) => +b.grossWorldWide - +a.grossWorldWide).slice(0, 5);
    updateLines(top5);
  });

  d3.select("#resetBtn").on("click", function() {
    d3.select("#yearFilter").property("value", years[0]);
    d3.select("#genreFilter").property("value", "All");
    d3.select("#top20Filter").property("value", "None");
    updateLines(fullData);
  });


});
