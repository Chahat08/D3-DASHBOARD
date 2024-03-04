document.addEventListener('DOMContentLoaded', function () {

    fetch('/elbow_plot_data')
        .then(response => response.json())
        .then(data => {
            // Extract data
            const K_range = data.K_range;
            const distortions = data.distortions;

            // Set up dimensions and margins
            const margin = { top: 20, right: 30, bottom: 30, left: 50 };
            const width = 600 - margin.left - margin.right;
            const height = 400 - margin.top - margin.bottom;

            // Create SVG element
            const svg = d3.select("#elbowPlot")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Set up scales
            const xScale = d3.scaleLinear()
                .domain([1, K_range.length])
                .range([0, width]);

            const yScale = d3.scaleLinear()
                .domain(d3.extent(distortions))
                .range([height, 0]);

            // Define the line
            const line = d3.line()
                .x((d, i) => xScale(i + 1))
                .y(d => yScale(d));

            // Draw the line
            svg.append("path")
                .datum(distortions)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d", line);

            // Add X axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale));

            // Add Y axis
            svg.append("g")
                .call(d3.axisLeft(yScale));

            // Add labels
            svg.append("text")
                .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.top + 10) + ")")
                .style("text-anchor", "middle")
                .text("Number of clusters (K)");

            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Distortion");

        })
        .catch(error => console.error('Error:', error));
});
