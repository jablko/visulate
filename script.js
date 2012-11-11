var sktStatus = d3.select('body').append('div').attr('id', 'sktStatus'), clientCount;

function chi(d) { return d[0]; }
function pqsn(d) { return d[0]; }
function psql(d) { return d[1][1]; }

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

    textChi.enter().append('text')
      .attr('class', 'chi')
      .attr('y', function (d, i) { return 20 * i + 14; }); // vertical-align: middle

    textChi.text(function (d) { return chi(d); });

    var margin = d3.max(textChi[0].map(function (itm) { return itm.getComputedTextLength(); }));

    g.attr('transform', 'translate(' + margin + ')');

    x.domain([0, psql(data[0])])
      .range([0, svg.node().parentNode.offsetWidth - margin - 6]);

    var rectPsql = g.selectAll('rect.psql').data(data.slice(begin, begin + 8));

    rectPsql.enter().append('rect')
      .attr('class', 'psql')
      .attr('height', 20)
      .attr('x', 6)
      .attr('y', function (d, i) { return 20 * i; });

    rectPsql.attr('width', function (d) { return x(psql(d)); });

    var textPsql = g.selectAll('text.psql').data(data.slice(begin, begin + 8));

    textPsql.enter().append('text')
      .attr('class', 'psql')
      .attr('y', function (d, i) { return 20 * i + 14; }); // vertical-align: middle

    textPsql.text(function (d) { return format(psql(d)); });

    textPsql.attr('fill', function (d) { return this.getComputedTextLength() + 12 > x(psql(d)) ? '#000' : '#fff'; })
      .attr('text-anchor', function (d) { return this.getComputedTextLength() + 12 > x(psql(d)) ? 'start' : 'end'; })
      .attr('x', function (d) { return this.getComputedTextLength() + 12 > x(psql(d)) ? x(psql(d)) + 12 : x(psql(d)); });
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
    .y1(function (d) { return y(psql(d)); });

  var line = d3.svg.line()
    .interpolate('monotone')
    .x(function (d, i) { return x(i); })
    .y(function (d) { return y(psql(d)); });

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
    data = [];
    for (var itm in nstData)
    {
      data.push([itm, nstData[itm]]);
    }

    data.sort(function (a, b) { return d3.descending(psql(a), psql(b)); });

    y.domain([0, psql(data[0])]);
    yAxis.tickValues([0, psql(data[0])]);

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

var chiData, pqsnData;

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
          for (var itm in data[0])
          {
            chiData[itm] = data[0][itm];
          }

          chiChart(chiData);

          for (var itm in data[1])
          {
            pqsnData[itm] = data[1][itm];
          }

          pqsnChart(pqsnData);
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
            chiChart(chiData = data[0]);

            pqsnChart(pqsnData = data[1]);

            if (!clientCount)
            {
              clientCount = d3.select('body').append('div').attr('id', 'clientCount');
            }

            clientCount.classed('disconnected', data[2] < 1);

            if (data[2] == 1)
            {
              clientCount.text('1 connected log collation client');
            }
            else
            {
              clientCount.text(d3.format(',')(data[2]) + ' connected log collation clients');
            }
          });

        backoff = 0;
      }
  })();
