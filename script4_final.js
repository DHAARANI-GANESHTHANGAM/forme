const width = window.innerWidth * 0.7;
const height = window.innerHeight;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("background", "#111");

svg.append("rect")
   .attr("width", width)
   .attr("height", height)
   .attr("fill", "#222");

let simulation, link, node;

const yearSteps = [1960, 1980, 1990, 2000, 2010, 2020, "summary"];

function loadAndDraw(year) {
  let file = `data/pre_${year}.csv`;
  d3.csv(file).then(data => {
    console.log("Loaded file:", file, "Entries:", data.length);
    console.log("Sample row:", data[0]);

    const nodes = [];
    const links = [];
    const genreSet = new Set();

    data.forEach(d => {
      if (!d.Title || !d.Genre) return;

      const movieNode = {
        id: d.Title,
        type: "movie",
        roi: parseFloat(d.ROI) || 0,
        budget: parseFloat(d.Budget) || 0,
        rating: parseFloat(d.Rating) || 0
      };
      nodes.push(movieNode);

      const genres = d.Genre.split("|").map(g => g.trim());
      genres.forEach(genre => {
        if (!genreSet.has(genre)) {
          genreSet.add(genre);
          nodes.push({ id: genre, type: "genre" });
        }
        links.push({ source: d.Title, target: genre });
      });
    });

    console.log("Nodes created:", nodes.length);
    console.log("Links created:", links.length);

    svg.selectAll("circle").remove();
    svg.selectAll("line").remove();

    link = svg.selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#888")
      .attr("stroke-opacity", 0.5);

    node = svg.selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => {
        if (d.type === "movie") {
          const r = Math.sqrt(d.roi) * 4 + 3;
          return isNaN(r) ? 6 : Math.max(6, r);
        }
        return 8;
      })
      .attr("fill", d => d.type === "movie" ? budgetColor(d.budget) : "#FFD700")
      .attr("stroke", d => d.type === "movie" && d.rating > 7 ? "white" : "none")
      .call(drag(simulation));

    simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    simulation.nodes(nodes).on("tick", ticked);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();

    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    }

    function drag(simulation) {
      return d3.drag()
        .on("start", event => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on("drag", event => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on("end", event => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        });
    }

    function budgetColor(budget) {
      if (budget < 10e6) return "#2ca02c";
      else if (budget < 50e6) return "#ff7f0e";
      else return "#d62728";
    }
  });
}

// Scroll interaction using IntersectionObserver
const steps = document.querySelectorAll(".step");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const index = [...steps].indexOf(entry.target);
      const year = yearSteps[index];
      if (year !== "summary") loadAndDraw(year);
    }
  });
}, { threshold: 0.5 });

steps.forEach(step => observer.observe(step));

loadAndDraw(1960);