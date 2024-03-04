// screePlot.js
document.addEventListener('DOMContentLoaded', function () {
    
    fetch('/pca_data')
        .then(response => response.json())
        .then(data => {
            // Extract data
            const explained_variance_ratio = data.explained_variance_ratio;
            const explained_variance_cumsum = data.explained_variance_cumsum;

            // Create SVG container
            const svg = d3.select('#screePlot')
                .append('svg')
                .attr('width', 600)
                .attr('height', 400);

            // Create scales
            const xScale = d3.scaleBand()
                .domain(d3.range(1, explained_variance_ratio.length + 1)) // start from 1
                .range([50, 550])
                .padding(0.1);

            const yScale = d3.scaleLinear()
                .domain([0, 1])
                .range([350, 50]);

            // Create bars
            svg.selectAll('rect')
                .data(explained_variance_ratio)
                .enter()
                .append('rect')
                .attr('x', (d, i) => xScale(i + 1)) // adjust x position
                .attr('y', d => yScale(d))
                .attr('width', xScale.bandwidth())
                .attr('height', d => 350 - yScale(d))
                .attr('fill', 'steelblue')
                .attr('index', (d, i)=>i)
                .on('click', function (event, d, i) {
                    const index = this.getAttribute('index');
                    // Send the selected dimensionality index to the server
                    fetch('/set_di', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ di: parseInt(index) + 1 }) 
                    });
                });

            // Create curve for explained variance
            const line = d3.line()
                .x((d, i) => xScale(i + 1) + xScale.bandwidth() / 2) // adjust x position
                .y(d => yScale(d))
                .curve(d3.curveCatmullRom);

            svg.append('path')
                .datum(explained_variance_cumsum)
                .attr('fill', 'none')
                .attr('stroke', 'red')
                .attr('stroke-width', 2)
                .attr('d', line);

            // Add axes
            const xAxis = d3.axisBottom(xScale)
                //.tickFormat(d => `${d}`); // label principal components
            svg.append('g')
                .attr('transform', 'translate(0, 350)')
                .call(xAxis);

            const yAxis = d3.axisLeft(yScale)
                .tickFormat(d3.format('.0%')); // format as percentage
            svg.append('g')
                .attr('transform', 'translate(50, 0)')
                .call(yAxis);

            // Label the chart
            svg.append('text')
                .attr('x', 300)
                .attr('y', 30)
                .style('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .text('Scree Plot');

            // Interaction elements
            const dot = svg.append('circle')
                .attr('r', 5)
                .attr('fill', 'steelblue')
                .style('display', 'none');

            const xLine = svg.append('line')
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3')
                .style('display', 'none');

            const yLine = svg.append('line')
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3')
                .style('display', 'none');

            const text = svg.append('text')
                .style('display', 'none');

            svg.on('mousemove', function (event) {
                const [x, y] = d3.pointer(event, this);
                const index = Math.floor((x - 50) / xScale.bandwidth());
                const xPos = xScale(index + 1) + xScale.bandwidth() / 2;
                const yPos = yScale(explained_variance_cumsum[index]);

                dot.attr('cx', xPos)
                    .attr('cy', yPos)
                    .style('display', 'block');

                xLine.attr('x1', xPos)
                    .attr('y1', yPos)
                    .attr('x2', xPos)
                    .attr('y2', 350)
                    .style('display', 'block');

                yLine.attr('x1', 50)
                    .attr('y1', yPos)
                    .attr('x2', xPos)
                    .attr('y2', yPos)
                    .style('display', 'block');

                text.attr('x', xPos + 10)
                    .attr('y', yPos - 10)
                    .text(`PC${index + 1}, ${d3.format('.1%')(explained_variance_cumsum[index])}`)
                    .style('display', 'block');

            });

            svg.on('mouseleave', function () {
                dot.style('display', 'none');
                xLine.style('display', 'none');
                yLine.style('display', 'none');
                text.style('display', 'none');
            });
        })
        .catch(error => console.error('Error:', error));
});
