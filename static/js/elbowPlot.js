document.addEventListener('DOMContentLoaded', function () {

    // Define padding values
    const margin = { top: 7, right: 15, bottom: 50, left: 50 };

    fetch('/elbow_plot_data')
        .then(response => response.json())
        .then(data => {
            // Extract data
            const K_range = data.K_range;
            const distortions = data.distortions;

            // Set up dimensions
            const width = document.querySelector('.elbowCol').offsetWidth - margin.left - margin.right;
            const height = document.querySelector('.elbowCol').offsetHeight - margin.top - margin.bottom;

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

            // Add horizontal grid lines
            svg.append("g")
                .attr("class", "grid")
                .call(d3.axisLeft(yScale)
                    .tickSize(-width)
                    .tickFormat("")
                    .tickSizeOuter(0)
                )
                .selectAll(".tick line")
                .attr("stroke", "#ddd"); // Adjusted grid line color

            // Add vertical grid lines
            svg.append("g")
                .attr("class", "grid")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale)
                    .tickSize(-height)
                    .tickFormat("")
                    .tickSizeOuter(0)
                )
                .selectAll(".tick line")
                .attr("stroke", "#ddd"); // Adjusted grid line color

            // Define the line
            const line = d3.line()
                .x((d, i) => xScale(i + 1))
                .y(d => yScale(d));

            // Draw the line
            svg.append("path")
                .datum(distortions)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
                .attr("d", line);

            // Add tooltips
            svg.selectAll(".dot")
                .append("title")
                .text((d, i) => `K: ${i + 1}, Distortion: ${d}`);

            // Interaction elements
            const dot = svg.append('circle')
                .attr('r', 5)
                .attr('fill', 'steelblue')
                .style('display', 'block');

            const xLine = svg.append('line')
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3')
                .style('display', 'block');

            const yLine = svg.append('line')
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3')
                .style('display', 'block');

            const text = svg.append('text')
                .style('display', 'block');

            let lastClickedIndex = null;

            // Add dots along the line
            svg.selectAll(".dot")
                .data(distortions)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("cx", (d, i) => xScale(i + 1))
                .attr("cy", (d) => yScale(d))
                .attr("r", 5)
                .attr("fill", "steelblue")
                .attr('index', (d, i) => i)
                .style('cursor', 'pointer')
                .on('click', function (event, d, i) {
                    svg.selectAll(".dot")
                        .attr("fill", "steelblue");
                    d3.select(this)
                        .attr("fill", "red");
                    const dotClickEvent = new CustomEvent('dotClicked');
                    document.dispatchEvent(dotClickEvent);
                    const index = this.getAttribute('index');
                    lastClickedIndex = parseInt(index);
                    // Send the selected dimensionality index to the server
                    fetch('/update_k', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ k: parseInt(index) + 1 })
                    });
                });

            svg.on('mousemove', function (event) {

                const [x, y] = d3.pointer(event, this);
                let nearestIndex = -1;
                let minDistance = Number.MAX_VALUE;

                distortions.forEach((d, i) => {
                    const xPos = xScale(i + 1);
                    const yPos = yScale(d);
                    const distance = Math.sqrt(Math.pow(xPos - x, 2) + Math.pow(yPos - y, 2));

                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestIndex = i;
                    }
                });

                const xPos = xScale(nearestIndex + 1);
                const yPos = yScale(distortions[nearestIndex]);

                dot.attr('cx', xPos)
                    .attr('cy', yPos)
                    .style('display', 'block');

                xLine.attr('x1', xPos)
                    .attr('y1', yPos)
                    .attr('x2', xPos)
                    .attr('y2', height)
                    .style('display', 'block');

                yLine.attr('x1', 0)
                    .attr('y1', yPos)
                    .attr('x2', xPos)
                    .attr('y2', yPos)
                    .style('display', 'block');

                text.attr('x', xPos + 10)
                    .attr('y', yPos - 10)
                    .text(`K: ${nearestIndex + 1}, Distortion: ${distortions[nearestIndex].toFixed(1)}`)
                    .style('display', 'block');
            });

            svg.on('mouseleave', function () {
                // Draw lines over the last clicked bar
                if (lastClickedIndex !== null) {
                    const xPos = xScale(lastClickedIndex + 1);
                    const yPos = yScale(distortions[lastClickedIndex]);
                    
                    xLine.attr('x1', xPos)
                        .attr('y1', yPos)
                        .attr('x2', xPos)
                        .attr('y2', height)
                        .style('display', 'block');

                    yLine.attr('x1', 0)
                        .attr('y1', yPos)
                        .attr('x2', xPos)
                        .attr('y2', yPos)
                        .style('display', 'block');

                    text.attr('x', xPos + 10)
                        .attr('y', yPos - 10)
                        .text(`K: ${lastClickedIndex + 1}, Distortion: ${distortions[lastClickedIndex].toFixed(1)
                }`)
                        .style('display', 'block');

                } else {
                    // If no bar was clicked, hide the lines
                    xLine.style('display', 'none');
                    yLine.style('display', 'none');
                }
            });

            // Add X axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale));

            // Add Y axis
            svg.append("g")
                .call(d3.axisLeft(yScale));

            // Add labels
            svg.append("text")
                .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.top + 20) + ")")
                .style("text-anchor", "middle")
                .text("Number of clusters (K)");

            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Distortion");

        }).catch(error => console.error('Error:', error));

});
