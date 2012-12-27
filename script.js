var sktStatus = d3.select('body').append('div').attr('id', 'sktStatus'), clientCount;

function chi(d) { return d[0]; }
function pqsn(d) { return d[0]; }

function all(d) { return d[1][0]; }
function hit(d) { return d[1][1]; }

function psql(d) { return d[1]; }

function format(value)
{
  // Avoid divide by zero
  if (!value)
  {
    return value;
  }

  var exponent = Math.floor(Math.log(1.1 * value) / Math.LN2 / 10);
  if (exponent < 9)
  {
    value /= Math.pow(1024, exponent);
  }

  // Round only if more than three digits, never add precision

  var result = value.toPrecision();
  if (result.replace(/e[+-]\d+|\D/g, '').length > 3)
  {
    result = value.toPrecision(value > 1 ? 3 : 2);
  }

  // The prefix kilo is often used in fields of computer science and
  // information technology with a meaning of multiplication by 1024 instead of
  // 1000, contrary to international standards, in conjunction with the base
  // unit byte and bit, in which case it is written with a capital letter K

  result += ['K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'][exponent - 1] || '';

  return result;
}

function barChart(div)
{
  var svg = div.append('svg').attr('class', 'bar'), g = svg.append('g');

  var x = d3.scale.linear();

  function my(data, begin)
  {
    var textChi = g.selectAll('text.chi').data(data.slice(begin, begin + 8));

    textChi.exit().remove();

    textChi.enter().append('text')
      .attr('class', 'chi')
      .attr('y', function (d, i) { return 20 * i + 14; }); // vertical-align: middle

    textChi.text(function (d) { return chi(d); });

    var margin = d3.max(textChi[0].map(function (itm) { return itm.getComputedTextLength(); }));

    g.attr('transform', 'translate(' + margin + ')');

    x.domain([0, psql(all(data[0]))])
      .range([0, svg.node().parentNode.offsetWidth - margin - 6]);

    var rectAll = g.selectAll('rect.all').data(data.slice(begin, begin + 8));

    rectAll.exit().remove();

    rectAll.enter().append('rect')
      .attr('class', 'all')
      .attr('height', 19)
      .attr('x', 6)
      .attr('y', function (d, i) { return 20 * i + .5; });

    rectAll.attr('width', function (d) { return x(psql(all(d))); });

    var rectHit = g.selectAll('rect.hit').data(data.slice(begin, begin + 8));

    rectHit.exit().remove();

    rectHit.enter().append('rect')
      .attr('class', 'hit')
      .attr('height', 19)
      .attr('x', 6)
      .attr('y', function (d, i) { return 20 * i + .5; });

    rectHit.attr('width', function (d) { return x(psql(hit(d))); });

    var textPsql = g.selectAll('text.psql').data(data.slice(begin, begin + 8));

    textPsql.exit().remove();

    textPsql.enter().append('text')
      .attr('class', 'psql')
      .attr('y', function (d, i) { return 20 * i + 14; }); // vertical-align: middle

    textPsql.text(function (d) { return format(psql(all(d))); });

    textPsql.attr('fill', function (d) { return this.getComputedTextLength() + 12 > x(psql(all(d))) ? '#000' : '#fff'; })
      .attr('text-anchor', function (d) { return this.getComputedTextLength() + 12 > x(psql(all(d))) ? 'start' : 'end'; })
      .attr('x', function (d) { return this.getComputedTextLength() + 12 > x(psql(all(d))) ? x(psql(all(d))) + 12 : x(psql(all(d))); });
  }

  return my;
}

function chart(div)
{
  var svg = div.append('svg').attr('class', 'line'), g = svg.append('g');

  // Add the area path
  var pathArea = g.append('path').attr('class', 'area');

  // Add the line path
  var pathLine = g.append('path').attr('class', 'line');

  // Add the extent
  var extent = g.append('rect').attr('class', 'extent');

  // Add the x-axis
  var x = d3.scale.linear(),
    xAxis = d3.svg.axis().scale(x),
    gXAxis = g.append('g').attr('class', 'x axis').call(xAxis);

  var marginBottom = gXAxis.node().getBBox().height, marginRight = 0;

  // Add the y-axis
  var y = d3.scale.linear(),
    yAxis = d3.svg.axis().orient('left').scale(y).tickFormat(format),
    gYAxis = g.append('g').attr('class', 'y axis').call(yAxis);

  var marginLeft = 0, marginTop = gYAxis.node().getBBox().y;

  y.range([parseInt(svg.style('height')) + marginTop - marginBottom, 0]);
  gXAxis.attr('transform', 'translate(0,' + (parseInt(svg.style('height')) + marginTop - marginBottom) + ')');
  extent.attr('height', parseInt(svg.style('height')) + marginTop - marginBottom);

  var area = d3.svg.area()
    .interpolate('monotone')
    .x(function (d, i) { return x(i); })
    .y0(parseInt(svg.style('height')) + marginTop - marginBottom)
    .y1(function (d) { return y(psql(all(d))); });

  var line = d3.svg.line()
    .interpolate('monotone')
    .x(function (d, i) { return x(i); })
    .y(function (d) { return y(psql(all(d))); });

  var data, nstBarChart = barChart(div);

  var begin = 0;

  var control = g.append('rect')
    .attr('class', 'control')
    .attr('height', parseInt(svg.style('height')) + marginTop - marginBottom)
    .on('click', function ()
      {
        begin = Math.max(0, Math.min(data.length - 8, Math.round(x.invert(d3.event.pageX - svg.node().getBoundingClientRect().left + marginLeft - x(8) / 2))));

        extent.attr('x', x(begin));

        nstBarChart(data, begin);
      });

  function my(nstData)
  {
    data = nstData;

    y.domain([0, psql(all(data[0]))]);
    yAxis.tickValues([0, psql(all(data[0]))]);

    // Add the y-axis
    gYAxis.call(yAxis);

    marginLeft = Math.min(marginLeft, gYAxis.node().getBBox().x);

    x.domain([0, data.length])
      .range([0, svg.node().parentNode.offsetWidth + marginLeft - marginRight]);

    // Add the x-axis
    gXAxis.call(xAxis);

    if (marginRight < gXAxis.node().getBBox().width - svg.node().parentNode.offsetWidth - marginLeft)
    {
      marginRight = gXAxis.node().getBBox().width - svg.node().parentNode.offsetWidth - marginLeft;

      x.range([0, svg.node().parentNode.offsetWidth + marginLeft - marginRight]);
      gXAxis.call(xAxis);
    }

    g.attr('transform', 'translate(' + -marginLeft + ',' + -marginTop + ')');

    // Add the area path
    pathArea.attr('d', area(data))

    // Add the line path
    pathLine.attr('d', line(data));

    // Add the extent
    extent.attr('width', x(8));

    control.attr('width', svg.node().parentNode.offsetWidth + marginLeft - marginRight);

    nstBarChart(data, begin);
  }

  return my;
}

var chiData, pqsnData, chiPqsnData;

var chiChart = chart(d3.select('body').append('div')),
  pqsnChart = chart(d3.select('body').append('div'));

var backoff = 0;

(function connect()
  {
    sktStatus.text('Connecting...');

    var skt = new WebSocket('ws://' + location.host + '/skt');

    skt.onclose = function ()
      {
        sktStatus.classed('disconnected', true).text('Disconnected');

        // The first reconnect attempt SHOULD be delayed by a random amount of
        // time.  The parameters by which this random delay is chosen are left
        // to the client to decide; a value chosen randomly between 0 and 5
        // seconds is a reasonable initial delay though clients MAY choose a
        // different interval from which to select a delay length based on
        // implementation experience and particular application

        setTimeout(connect, Math.random() * 5000 << backoff);

        // Should the first reconnect attempt fail, subsequent reconnect
        // attempts SHOULD be delayed by increasingly longer amounts of time,
        // using a method such as truncated binary exponential backoff

        if (backoff < 5)
        {
          backoff += 1;
        }
      }

    skt.onmessage = function (evt)
      {
        var data = JSON.parse(evt.data);
        if (data[0])
        {
          // chi

          for (var itm in data[0])
          {
            chiData[itm] = data[0][itm];
          }

          var chiSort = [];
          for (var itm in chiData)
          {
            chiSort.push([itm, chiData[itm]]);
          }

          chiSort.sort(function (a, b) { return d3.descending(psql(all(a)), psql(all(b))); });

          chiChart(chiSort);

          // pqsn

          for (var itm in data[1])
          {
            pqsnData[itm] = data[1][itm];
          }

          var pqsnSort = [];
          for (var itm in pqsnData)
          {
            pqsnSort.push([itm, pqsnData[itm]]);
          }

          pqsnSort.sort(function (a, b) { return d3.descending(psql(all(a)), psql(all(b))); });

          pqsnChart(pqsnSort);
        }
        else
        {
          clientCount.classed('disconnected', data < 1);

          if (data == 1)
          {
            clientCount.text('1 connected log collation client');
          }
          else
          {
            clientCount.text(d3.format(',')(data) + ' connected log collation clients');
          }
        }
      }

    skt.onopen = function ()
      {
        sktStatus.classed('disconnected', false).text('Connected.');

        d3.json('/open', function (data)
          {
            // chi

            chiData = data[0];

            var chiSort = [];
            for (var itm in chiData)
            {
              chiSort.push([itm, chiData[itm]]);
            }

            if (chiSort.length)
            {
              chiSort.sort(function (a, b) { return d3.descending(psql(all(a)), psql(all(b))); });

              chiChart(chiSort);
            }

            // pqsn

            pqsnData = data[1];

            var pqsnSort = [];
            for (var itm in pqsnData)
            {
              pqsnSort.push([itm, pqsnData[itm]]);
            }

            if (pqsnSort.length)
            {
              pqsnSort.sort(function (a, b) { return d3.descending(psql(all(a)), psql(all(b))); });

              pqsnChart(pqsnSort);
            }

            // chiPqsn

            chiPqsnData = data[2];

            var chiPqsnSort = [];
            chiSort.slice(0, 8).forEach(function (chiItm)
              {
                pqsnSort.slice(0, 8).forEach(function (pqsnItm)
                  {
                    if (chiPqsnData[chi(chiItm)][pqsn(pqsnItm)])
                    {
                      chiPqsnSort.push([chi(chiItm), pqsn(pqsnItm), chiPqsnData[chi(chiItm)][pqsn(pqsnItm)]]);
                    }
                  });
              });

            chiPqsnSort.sort(function (a, b) { return d3.descending(psql(a[2][0]), psql(b[2][0])); });

            var svg = d3.select('body').append('div').attr('id', 'chiPqsn').append('svg'), g = svg.append('g');

            var max = 0;
            d3.values(chiPqsnData).forEach(function (itm)
              {
                d3.values(itm).forEach(function (itm)
                  {
                    max = Math.max(max, psql(itm[0]));
                  });
              });

            var r = d3.scale.sqrt()
              .domain([0, max])
              .range([0, 80]);

            var rBottom = rTop = 0;
            chiSort.slice(0, 8).forEach(function (itm)
              {
                if (chiPqsnData[chi(itm)][pqsn(pqsnSort[0])])
                {
                  rBottom = Math.max(rBottom, r(psql(chiPqsnData[chi(itm)][pqsn(pqsnSort[0])][0])));
                }

                if (chiPqsnData[chi(itm)][pqsn(pqsnSort[7])])
                {
                  rTop = Math.max(rTop, r(psql(chiPqsnData[chi(itm)][pqsn(pqsnSort[7])][0])));
                }
              });

            var rLeft = rRight = 0;
            pqsnSort.slice(0, 8).forEach(function (itm)
              {
                if (chiPqsnData[chi(chiSort[0])][pqsn(itm)])
                {
                  rLeft = Math.max(rLeft, r(psql(chiPqsnData[chi(chiSort[0])][pqsn(itm)][0])));
                }

                if (chiPqsnData[chi(chiSort[7])][pqsn(itm)])
                {
                  rRight = Math.max(rRight, r(psql(chiPqsnData[chi(chiSort[7])][pqsn(itm)][0])));
                }
              });

            var marginTop = rTop, marginRight = rRight;

            // Add the x-axis
            var x = d3.scale.ordinal()
              .domain(chiSort.slice(0, 8).map(chi))
              .rangePoints([0, 320 - marginTop - rBottom]);

            var xAxis = d3.svg.axis().scale(x);

            var gXAxis = g.append('g')
              .attr('class', 'x axis')
              .call(xAxis);

            gXAxis.selectAll('text').attr('transform', 'rotate(30)');

            var marginBottom = gXAxis.node().getBBox().height;

            // Add the y-axis
            var y = d3.scale.ordinal()
              .domain(pqsnSort.slice(0, 8).map(pqsn))
              .rangePoints([320 - marginTop - rBottom - marginBottom, 0]);

            var yAxis = d3.svg.axis().orient('left').scale(y);

            var gYAxis = g.append('g')
              .attr('class', 'y axis')
              .attr('transform', 'translate(' + -rLeft + ')')
              .call(yAxis);

            var marginLeft = gYAxis.node().getBBox().x;

            if (marginTop < gYAxis.node().getBBox().y)
            {
              marginTop = gYAxis.node().getBBox().y;

              y.rangePoints([320 - marginTop - rBottom - marginBottom, 0]);
              gYAxis.call(yAxis);
            }

            x.rangePoints([0, 320 - marginTop - rBottom - marginBottom]);
            gXAxis.attr('transform', 'translate(0,' + (320 - marginTop - marginBottom) + ')').call(xAxis);

            var fill = d3.scale.linear()
              .domain([0, 1])
              .range(['#58b', '#f60']);

            var circle = g.selectAll('circle').data(chiPqsnSort);

            circle.exit().remove();

            circle.enter().append('circle')
              .attr('cx', function (d) { return x(d[0]); })
              .attr('cy', function (d) { return y(d[1]); })
              .attr('fill', function (d) { return fill(psql(d[2][1]) / psql(d[2][0])); })
              .attr('r', function (d) { return r(psql(d[2][0])); });

            svg.attr('width', Math.max(320 - marginTop - rBottom - marginBottom + rRight, gXAxis.node().getBBox().width) - marginLeft + rLeft);

            g.attr('transform', 'translate(' + (rLeft - marginLeft) + ',' + marginTop + ')');

            // clientCount

            if (!clientCount)
            {
              clientCount = d3.select('body').append('div').attr('id', 'clientCount');
            }

            clientCount.classed('disconnected', data[3] < 1);

            if (data[3] == 1)
            {
              clientCount.text('1 connected log collation client');
            }
            else
            {
              clientCount.text(d3.format(',')(data[3]) + ' connected log collation clients');
            }
          });

        backoff = 0;
      }
  })();
