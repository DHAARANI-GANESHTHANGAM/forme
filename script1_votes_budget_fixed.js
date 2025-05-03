
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

function parseMetric(str) {
  if (!str) return NaN;
  const value = parseFloat(str.replace(/[^\d.]/g, ""));
  if (str.includes("K")) return value * 1e3;
  if (str.includes("M")) return value * 1e6;
  if (str.includes("B")) return value * 1e9;
  return +str;
}

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
