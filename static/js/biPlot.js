// Function to draw the biplot
function drawBiplot(biplotData) {
    console.log(biplotData.loadings);
    console.log(biplotData.feature_names);

    // Clear any existing SVG to make room for the biplot
    d3.select("#biPlot svg").remove();

    // Set the dimensions and margins of the graph
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    // Get the width and height of the container
    const containerWidth = document.querySelector('.biPlotCol').offsetWidth;
    const containerHeight = document.querySelector('.biPlotCol').offsetHeight;

    console.log(containerWidth);
    console.log(containerHeight);

    // Calculate the width and height of the SVG
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Update the scales
    const xExtent = d3.extent([...biplotData.scores.map(d => d[0]), ...biplotData.loadings.flat()]);
    const yExtent = d3.extent([...biplotData.scores.map(d => d[1]), ...biplotData.loadings.flat()]);
    const xScale = d3.scaleLinear().domain(xExtent).range([0, width]);
    const yScale = d3.scaleLinear().domain(yExtent).range([height, 0]);

    // Adjust SVG width and height
    const svg = d3.select("#biPlot").append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Translate the axes to the center
    svg.append("g")
        .attr("transform", `translate(0,${yScale(0)})`) // Translate to vertical center
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", `translate(${xScale(0)},0)`) // Translate to horizontal center
        .call(d3.axisLeft(yScale));

    // Create the tooltip div as a hidden element in the body
    const tooltipDiv = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("display", "none"); // Start hidden, CSS will control the rest

    // Later on, when you create the dots:
    const dots = svg.selectAll(".dot")
        .data(biplotData.scores)
        .enter()
        .append("circle")
        .attr("data-index", (d, i) => i)
        .attr("class", "dot")
        .attr("cx", d => xScale(d[0]))
        .attr("cy", d => yScale(d[1]))
        .attr("r", 3)
        .style("fill", "#69b3a2");

    const scalingFactor = 10;
    // Draw loading vectors for each feature
    biplotData.feature_names.forEach((feature, i) => {
        const loading = biplotData.loadings.map(d => d[i]); // Get the ith loading from each PC

        svg.append("line")
            .attr("x1", xScale(0))
            .attr("y1", yScale(0))
            .attr("x2", xScale(loading[0] * scalingFactor)) // Scale and center the loading vector
            .attr("y2", yScale(loading[1] * scalingFactor)) // Scale and center the loading vector
            .style("stroke", "steelblue")
            .style("stroke-width", 2);

        svg.append("text")
            .attr("x", xScale(loading[0] * scalingFactor))
            .attr("y", yScale(loading[1] * scalingFactor))
            .text(feature)
            .style("text-anchor", "start")
            .style("fill", "orange")
            .style("font-size", "12px");
    });

    // Add mouseover and mouseout events to the dots
    dots.on("mouseover", function (event, d) {
        const index = d3.select(this).attr("data-index"); // Get the index from the data attribute
        tooltipDiv.transition()
            .duration(200)
            .style("opacity", .9)
            .style("display", "block"); // Show the tooltip

        tooltipDiv.html(biplotData.observation_names[index]) // Get the name using the index
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px"); // Position the tooltip above the cursor
    })
        .on("mouseout", function () {
            tooltipDiv.transition()
                .duration(500)
                .style("opacity", 0)
                .style("display", "none"); // Hide the tooltip after mouseout
        });
}

// Fetch biplot data from Flask backend
fetch('/biplot_data')
    .then(response => response.json())
    .then(data => drawBiplot(data))
    .catch(error => console.error('Error fetching biplot data:', error));
