document.addEventListener('DOMContentLoaded', function () {
    // Fetch top attributes and corresponding data from backend
    fetch('/get_top_attributes')
        .then(response => response.json())
        .then(data => {
            const top_attributes = data.top_attributes;
            const top_attribute_data = data.data;

            // Once data is fetched, create the scatter plot matrix
            createScatterPlotMatrix(top_attribute_data, top_attributes);
        })
        .catch(error => console.error('Error:', error));

    // Function to create scatter plot matrix
    function createScatterPlotMatrix(data, columns) {
        // Specify the chart’s dimensions
        const width = 928;
        const height = width;
        const padding = 28;
        const size = (width - (columns.length + 1) * padding) / columns.length + padding;

        // Define the horizontal scales (one for each row)
        const x = columns.map(c => d3.scaleLinear()
            .domain(d3.extent(data, d => d[c]))
            .rangeRound([padding / 2, size - padding / 2]));

        // Define the companion vertical scales (one for each column)
        const y = x.map(x => x.copy().range([size - padding / 2, padding / 2]));

        // Define the color scale
        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.species)) // Assuming species attribute is present in your data
            .range(d3.schemeCategory10);

        // Define the horizontal axis
        const axisx = d3.axisBottom()
            .ticks(6)
            .tickSize(size * columns.length);
        const xAxis = g => g.selectAll("g").data(x).join("g")
            .attr("transform", (d, i) => `translate(${i * size},0)`)
            .each(function (d) { return d3.select(this).call(axisx.scale(d)); })
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));

        // Define the vertical axis
        const axisy = d3.axisLeft()
            .ticks(6)
            .tickSize(-size * columns.length);
        const yAxis = g => g.selectAll("g").data(y).join("g")
            .attr("transform", (d, i) => `translate(0,${i * size})`)
            .each(function (d) { return d3.select(this).call(axisy.scale(d)); })
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));

        // Create SVG element
        const svg = d3.select('#scatterPlot').append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-padding, 0, width, height]);

        // Append style
        svg.append("style")
            .text(`circle.hidden { fill: #000; fill-opacity: 1; r: 1px; }`);

        // Append x-axis
        svg.append("g")
            .call(xAxis);

        // Append y-axis
        svg.append("g")
            .call(yAxis);

        // Create cells
        const cell = svg.selectAll(".cell").data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
            .join("g")
            .attr("class", "cell")
            .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

        // Append rectangles
        cell.append("rect")
            .attr("fill", "none")
            .attr("stroke", "#aaa")
            .attr("x", padding / 2 + 0.5)
            .attr("y", padding / 2 + 0.5)
            .attr("width", size - padding)
            .attr("height", size - padding);

        // Append circles
        cell.each(function ([i, j]) {
            d3.select(this).selectAll("circle")
                .data(data.filter(d => !isNaN(d[columns[i]]) && !isNaN(d[columns[j]])))
                .join("circle")
                .attr("cx", d => x[i](d[columns[i]]))
                .attr("cy", d => y[j](d[columns[j]]))
                .attr("r", 3.5)
                .attr("fill-opacity", 0.7)
                .attr("fill", d => color(d.species));
        });

        // Append text labels
        svg.append("g")
            .style("font", "bold 10px sans-serif")
            .style("pointer-events", "none")
            .selectAll("text")
            .data(columns)
            .join("text")
            .attr("transform", (d, i) => `translate(${i * size},${i * size})`)
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".71em")
            .text(d => d);
    }
});
