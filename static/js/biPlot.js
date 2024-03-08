document.addEventListener('DOMContentLoaded', function () {

    document.addEventListener('dotClicked', function (event) {
        fetchAndUpdateBiPlotData();
    });

    fetchAndUpdateBiPlotData();

    function fetchAndUpdateBiPlotData() {
        fetch('/biplot_data')
            .then(response => response.json())
            .then(data => drawBiplot(data))
            .catch(error => console.error('Error fetching biplot data:', error));
    }

    function drawBiplot(biplotData) {
        d3.select("#biPlot svg").remove();

        const margin = { top: 20, right: 20, bottom: 25, left: 30 };

        const containerWidth = document.querySelector('.biPlotCol').offsetWidth;
        const containerHeight = document.querySelector('.biPlotCol').offsetHeight;

        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        const xExtent = d3.extent([...biplotData.scores.map(d => d[0]), ...biplotData.loadings.flat()]);
        const yExtent = d3.extent([...biplotData.scores.map(d => d[1]), ...biplotData.loadings.flat()]);
        const xScale = d3.scaleLinear().domain(xExtent).range([0, width]);
        const yScale = d3.scaleLinear().domain(yExtent).range([height, 0]);

        const svg = d3.select("#biPlot").append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        svg.append("text")
            .attr("transform", `translate(${width / 2 - 15}, ${height + margin.top})`)
            .style("text-anchor", "middle")
            .text("PC1");

        svg.append("text")
            .attr("transform", `rotate(-90)`)
            .attr("y", 0 - margin.left + 7)
            .attr("x", 0 - (height / 2) - 20)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("PC2");

        svg.append("text")
            .attr("x", width / 4)
            .attr("y", (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Biplot");

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const dots = svg.selectAll("circle")
            .data(biplotData.scores)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d[0]))
            .attr("cy", d => yScale(d[1]))
            .attr("r", 2)
            .attr("fill-opacity", 0.7)
            .style("fill", (d, i) => colorScale(biplotData.clusters[i]));

        svg.append("g")
            .attr("transform", `translate(0,${yScale(0)})`)
            .style('stroke-width', '2px')
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .attr("transform", `translate(${xScale(0)},0)`)
            .style('stroke-width', '2px')
            .call(d3.axisLeft(yScale));

        const scalingFactor = 4;
        biplotData.feature_names.forEach((feature, i) => {
            const loading = biplotData.loadings.map(d => d[i]);

            const angle = Math.atan2(loading[1], loading[0]) * (180 / Math.PI);

            svg.append("line")
                .attr("x1", xScale(0))
                .attr("y1", yScale(0))
                .attr("x2", xScale(loading[0] * scalingFactor))
                .attr("y2", yScale(loading[1] * scalingFactor))
                .style("stroke", "red")
                .style("stroke-width", 2);

            svg.append("text")
                .attr("x", xScale(loading[0] * scalingFactor))
                .attr("y", yScale(loading[1] * scalingFactor))
                .attr("transform", `rotate(${-angle}, ${xScale(loading[0] * scalingFactor)}, ${yScale(loading[1] * scalingFactor)})`)
                .text(feature)
                .style("text-anchor", "start")
                .style("fill", "black")
                .style("font-size", "10px");
        });

    }
});
