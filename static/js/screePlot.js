document.addEventListener('DOMContentLoaded', function () {

    fetch('/pca_data')
        .then(response => response.json())
        .then(data => {
            // Extract data
            const explained_variance_ratio = data.explained_variance_ratio;
            const explained_variance_cumsum = data.explained_variance_cumsum;

            // Get dimensions of the column
            const columnWidth = document.querySelector('.screeCol').offsetWidth;
            const columnHeight = document.querySelector('.screeCol').offsetHeight;

            const paddingLeft = 50; // Set padding for left
            const paddingRight = 0; // Set padding for right
            const paddingBottom = 30; // Set padding for bottom
            const paddingTop = 10; // Set padding for top

            // Create SVG container
            const svg = d3.select('#screePlot')
                .append('svg')
                .attr('width', columnWidth)
                .attr('height', columnHeight);

            // Create scales
            const xScale = d3.scaleBand()
                .domain(d3.range(1, explained_variance_ratio.length + 1)) // start from 1
                .range([paddingLeft, columnWidth - paddingRight]) // adjust based on column width and padding
                .padding(0.1);

            const yScale = d3.scaleLinear()
                .domain([0, 1])
                .range([columnHeight - paddingBottom, paddingTop]); // adjust based on column height

            // Create horizontal grid lines
            svg.selectAll('.horizontal-grid-line')
                .data(yScale.ticks(5))
                .enter().append('line')
                .attr('class', 'horizontal-grid-line')
                .attr('x1', paddingLeft)
                .attr('x2', columnWidth - paddingRight)
                .attr('y1', d => yScale(d))
                .attr('y2', d => yScale(d))
                .attr('stroke', '#ddd')
                .attr('stroke-opacity', 0.75);

            // Create vertical grid lines
            svg.selectAll('.vertical-grid-line')
                .data(xScale.domain())
                .enter().append('line')
                .attr('class', 'vertical-grid-line')
                .attr('x1', d => xScale(d) + xScale.bandwidth() / 2)
                .attr('x2', d => xScale(d) + xScale.bandwidth() / 2)
                .attr('y1', paddingTop)
                .attr('y2', columnHeight - paddingBottom)
                .attr('stroke', '#ddd')
                .attr('stroke-opacity', 0.75);

            let lastClickedIndex = null;

            // Create bars
            svg.selectAll('rect')
                .data(explained_variance_ratio)
                .enter()
                .append('rect')
                .attr('class', "screeRect")
                .attr('id', (d, i)=>"screeRect"+i)
                .attr('x', (d, i) => xScale(i + 1)) // adjust x position
                .attr('y', d => yScale(d))
                .attr('width', xScale.bandwidth())
                .attr('height', d => columnHeight - paddingBottom - yScale(d)) // adjust height based on column height
                .attr('fill', 'steelblue')
                .attr('index', (d, i) => i)
                .style('cursor', 'pointer')
                .on('click', function (event, d, i) {
                    svg.selectAll("rect")
                        .attr("fill", "steelblue");
                    d3.select(this)
                        .attr("fill", "red");
                    const barClickEvent = new CustomEvent('barClicked');
                    document.dispatchEvent(barClickEvent);
                    const index = this.getAttribute('index');
                    lastClickedIndex = parseInt(index);
                    d3.select('.diValue').text(parseInt(index)+1)
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
                .attr('transform', `translate(0, ${columnHeight - paddingBottom})`)
                .call(xAxis)
                .selectAll('text')
                .style('font-size', '10px'); // Font size

            const yAxis = d3.axisLeft(yScale)
                .tickFormat(d3.format('.0%')); // format as percentage
            const yAxisGroup = svg.append('g')
                .attr('transform', `translate(${paddingLeft}, 0)`) // adjust based on left padding
                .call(yAxis);

            yAxisGroup.selectAll('text')
                .style('font-size', '10px'); // Font size

            // Label the chart
            svg.append('text')
                .attr('x', columnWidth / 2)
                .attr('y', paddingTop + 5) // adjust y position
                .style('text-anchor', 'middle')
                .style('font-size', '16px') // Font size
                .style('font-weight', 'bold')
                .text('Scree Plot');

            // Add labels for axes
            svg.append('text')
                .attr('transform', `translate(${columnWidth / 2}, ${columnHeight - 5})`)
                .style('text-anchor', 'middle')
                .style('font-size', '14px') // Font size
                .text('Principal Component');

            svg.append('text')
                .attr('transform', `translate(${paddingLeft - 35}, ${columnHeight / 2}) rotate(-90)`) // adjust based on left padding
                .style('text-anchor', 'middle')
                .style('font-size', '14px') // Font size
                .text('Explained Variance Ratio');

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
                const index = Math.floor((x - paddingLeft) / ((columnWidth - paddingLeft - paddingRight) / explained_variance_ratio.length)); // adjust based on left padding
                const xPos = xScale(index + 1) + xScale.bandwidth() / 2;
                const yPos = yScale(explained_variance_cumsum[index]);

                dot.attr('cx', xPos)
                    .attr('cy', yPos)
                    .style('display', 'block');

                xLine.attr('x1', xPos)
                    .attr('y1', yPos)
                    .attr('x2', xPos)
                    .attr('y2', columnHeight - paddingBottom)
                    .style('display', 'block');

                yLine.attr('x1', paddingLeft) // adjust based on left padding
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
                // Draw lines over the last clicked bar
                let currIdx = lastClickedIndex !== null ? lastClickedIndex : 3;
                
                const xPos = xScale(currIdx + 1) + xScale.bandwidth() / 2;
                const yPos = yScale(explained_variance_cumsum[currIdx]);
                    xLine.attr('x1', xPos)
                        .attr('y1', yPos)
                        .attr('x2', xPos)
                        .attr('y2', columnHeight - paddingBottom)
                        .style('display', 'block');

                    yLine.attr('x1', paddingLeft) // adjust based on left padding
                        .attr('y1', yPos)
                        .attr('x2', xPos)
                        .attr('y2', yPos)
                        .style('display', 'block');

                    dot.attr('cx', xPos)
                        .attr('cy', yPos)
                        .style('display', 'block');

                    text.attr('x', xPos + 10)
                        .attr('y', yPos - 10)
                        .text(`PC${currIdx + 1}, ${d3.format('.1%')(explained_variance_cumsum[currIdx])}`)
                        .style('display', 'block');
            });

            const xPos = xScale(3 + 1) + xScale.bandwidth() / 2;
            const yPos = yScale(explained_variance_cumsum[3]);
            xLine.attr('x1', xPos)
                .attr('y1', yPos)
                .attr('x2', xPos)
                .attr('y2', columnHeight - paddingBottom)
                .style('display', 'block');

            yLine.attr('x1', paddingLeft) // adjust based on left padding
                .attr('y1', yPos)
                .attr('x2', xPos)
                .attr('y2', yPos)
                .style('display', 'block');

            dot.attr('cx', xPos)
                .attr('cy', yPos)
                .style('display', 'block');

            text.attr('x', xPos + 10)
                .attr('y', yPos - 10)
                .text(`PC${3 + 1}, ${d3.format('.1%')(explained_variance_cumsum[3])}`)
                .style('display', 'block');

            d3.select("#screeRect3").attr("fill", "red");

        })
        .catch(error => console.error('Error:', error));
});
