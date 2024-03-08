document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('barClicked', function (event) {
        fetchAndUpdateScatterPlotData();
    });

    document.addEventListener('dotClicked', function (event) {
        fetchAndUpdateScatterPlotData();
    });

    fetchAndUpdateScatterPlotData();

    let svg = d3.select('#scatterPlot').select("svg");

    function fetchAndUpdateScatterPlotData() {
        fetch('/get_top_attributes')
            .then(response => response.json())
            .then(data => {
                const top_attributes = data.top_attributes;
                const top_attribute_data = data.data;
                const top_loadings = data.top_loadings;

                svg.remove();

                d3.select('#attributeTableBody').select("table").remove();

                createAttributeTable(top_attributes, top_loadings);
                createScatterPlotMatrix(top_attribute_data, top_attributes);
            })
            .catch(error => console.error('Error:', error));
    }

    function createScatterPlotMatrix(data, columns) {
        const scatterColWidth = document.querySelector('.scatterCol').offsetWidth;
        const scatterColHeight = document.querySelector('.scatterCol').offsetHeight;

        const width = scatterColWidth;
        const height = scatterColHeight;
        const padding = 20;
        const size = (width - (columns.length + 1) * padding) / columns.length + padding;

        const x = columns.map(c => d3.scaleLinear()
            .domain(d3.extent(data, d => d[c]))
            .rangeRound([padding / 2, size - padding / 2]));

        const y = x.map(x => x.copy().range([size - padding / 2, padding / 2]));

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const axisx = d3.axisBottom()
            .ticks(6)
            .tickSize(size * columns.length);
        const xAxis = g => g.selectAll("g").data(x).join("g")
            .attr("transform", (d, i) => `translate(${i * size},0)`)
            .each(function (d) { return d3.select(this).call(axisx.scale(d)); })
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"))
            .call(g => g.selectAll(".tick text").style("font-size", "8px"));;

        const axisy = d3.axisLeft()
            .ticks(6)
            .tickSize(-size * columns.length);
        const yAxis = g => g.selectAll("g").data(y).join("g")
            .attr("transform", (d, i) => `translate(0,${i * size})`)
            .each(function (d) { return d3.select(this).call(axisy.scale(d)); })
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"))
            .call(g => g.selectAll(".tick text").style("font-size", "8px"));;

        svg = d3.select('#scatterPlot').append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-padding, -padding, width, height]);

        svg.append("style")
            .text(`circle.hidden { fill: #000; fill-opacity: 1; r: 1px; }`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Scatter Plot Matrix");

        svg.append("g")
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

        const cell = svg.selectAll(".cell").data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
            .join("g")
            .attr("class", "cell")
            .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

        cell.append("rect")
            .attr("fill", "none")
            .attr("stroke", "#aaa")
            .attr("x", padding / 2 + 0.5)
            .attr("y", padding / 2 + 0.5)
            .attr("width", size - padding)
            .attr("height", size - padding);

        cell.each(function ([i, j]) {
            d3.select(this).selectAll("circle")
                .data(data.filter(d => !isNaN(d[columns[i]]) && !isNaN(d[columns[j]])))
                .join("circle")
                .attr("cx", d => x[i](d[columns[i]]))
                .attr("cy", d => y[j](d[columns[j]]))
                .attr("r", 1.5)
                .attr("fill-opacity", 0.7)
                .attr("fill", d => color(d.cluster));
        });

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

    function createAttributeTable(attributes, loadings) {
        d3.select('#attributeTableBody').selectAll('tr').remove();

        let tableBody = d3.select('#attributeTableBody');

        let rows = tableBody.selectAll('tr')
            .data(attributes)
            .enter()
            .append('tr')
            .style("background-color", (d, i) => i % 2 === 0 ? "#ffffff" : "#f2f2f2");

        rows.append('td')
            .html((d, i) => d + "<br>" + '(' + loadings[i].toFixed(2) + ')')
            .style("font-size", d => d === "DiabetesPedigreeFunction" ? "6px" : "10px");
    }
});
