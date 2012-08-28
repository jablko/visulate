var socket = d3.select('body').append('div').attr('id', 'socket');

var backoff = 1;

var svg = d3.select('body').append('svg');

var clients = d3.select('body').append('div').attr('id', 'clients');

function humanize(value)
{
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

(function connect()
  {
    socket.text('Connecting...');

    var length;

    var skt = new WebSocket('ws://' + location.host + '/skt');

    skt.onclose = function ()
      {
        socket.classed('disconnected', true).text('Disconnected');

        // The first reconnect attempt SHOULD be delayed by a random amount of
        // time.  The parameters by which this random delay is chosen are left
        // to the client to decide; a value chosen randomly between 0 and 5
        // seconds is a reasonable initial delay though clients MAY choose a
        // different interval from which to select a delay length based on
        // implementation experience and particular application

        setTimeout(connect, Math.random() * 5000 * backoff);

        // Should the first reconnect attempt fail, subsequent reconnect
        // attempts SHOULD be delayed by increasingly longer amounts of time,
        // using a method such as truncated binary exponential backoff

        if (backoff < 1 << 5)
        {
          backoff <<= 1;
        }
      }

    skt.onmessage = function (evt)
      {
        var result = JSON.parse(evt.data);
        if (result instanceof Array)
        {
          result.forEach(function (d)
            {
              // http://www.w3.org/TR/CSS21/syndata#value-def-identifier
              var g = d3.select('#\\00003' + d[0].replace(/\./g, '\\.'));
              if (g.empty())
              {
                g = svg.append('g').attr('id', d[0]);

                g.append('text')
                  .attr('class', 'chi')
                  .attr('y', 20 * length + 14) // vertical-align: middle;
                  .text(d[0]);

                g.append('rect').datum(d)
                  .attr('height', 20)
                  .attr('y', 20 * length);

                g.append('text').datum(d)
                  .attr('class', 'psql')
                  .attr('y', 20 * length + 14) // vertical-align: middle;
                  .text(humanize(d[2]));

                length += 1;
              }
              else
              {
                g.select('rect').datum(d);

                g.select('.psql').datum(d)
                  .text(humanize(d[2]));
              }
            });

          var chi = svg.selectAll('.chi');

          var xChi = d3.max(chi[0].map(function (itm) { return itm.getComputedTextLength(); }));

          chi.attr('x', xChi);

          var xPsql = d3.scale.linear()
            .domain([0, d3.max(svg.selectAll('rect').data().map(function (d) { return d[2]; }))])
            .range([0, svg.node().parentNode.offsetWidth - xChi - 4]);

          svg.selectAll('rect')
            .attr('width', function (d) { return xPsql(d[2]); })
            .attr('x', xChi + 4);

          svg.selectAll('.psql')
            .attr('fill', function (d) { return this.getComputedTextLength() + 8 > xPsql(d[2]) ? '#000' : '#fff'; })
            .attr('text-anchor', function (d) { return this.getComputedTextLength() + 8 > xPsql(d[2]) ? 'start' : 'end'; })
            .attr('x', function (d) { return this.getComputedTextLength() + 8 > xPsql(d[2]) ? xChi + xPsql(d[2]) + 8 : xChi + xPsql(d[2]); });

          svg.attr('height', 20 * length);
        }
        else
        {
          clients.classed('disconnected', result < 1);

          if (result == 1)
          {
            clients.text('1 connected log collation client');
          }
          else
          {
            clients.text(d3.format(',')(result) + ' connected log collation clients');
          }
        }
      }

    skt.onopen = function ()
      {
        socket.classed('disconnected', false).text('Connected.');

        backoff = 1;

        d3.json('/open', function (result)
          {
            var g = svg.selectAll('g').data(result[0]);

            g.enter().append('g').call(function ()
              {
                this.append('text')
                  .attr('class', 'chi')
                  .attr('y', function (d, i) { return 20 * i + 14; }); // vertical-align: middle;

                this.append('rect')
                  .attr('height', 20)
                  .attr('y', function (d, i) { return 20 * i; });

                this.append('text')
                  .attr('class', 'psql')
                  .attr('y', function (d, i) { return 20 * i + 14; }); // vertical-align: middle;
              });

            g.attr('id', function (d) { return d[0]; });

            g.exit().remove();

            var chi = svg.selectAll('.chi');

            chi.text(function (d) { return d[0]; });

            var xChi = d3.max(chi[0].map(function (itm) { return itm.getComputedTextLength(); }));

            chi.attr('x', xChi);

            var xPsql = d3.scale.linear()
              .domain([0, d3.max(result[0].map(function (d) { return d[2]; }))])
              .range([0, svg.node().parentNode.offsetWidth - xChi - 4]);

            svg.selectAll('rect')
              .attr('width', function (d) { return xPsql(d[2]); })
              .attr('x', xChi + 4);

            var psql = svg.selectAll('.psql');

            psql.text(function (d) { return humanize(d[2]); });

            psql.attr('fill', function (d) { return this.getComputedTextLength() + 8 > xPsql(d[2]) ? '#000' : '#fff'; })
              .attr('text-anchor', function (d) { return this.getComputedTextLength() + 8 > xPsql(d[2]) ? 'start' : 'end'; })
              .attr('x', function (d) { return this.getComputedTextLength() + 8 > xPsql(d[2]) ? xChi + xPsql(d[2]) + 8 : xChi + xPsql(d[2]); });

            length = result[0].length;

            svg.attr('height', 20 * length);

            clients.classed('disconnected', result[1] < 1);

            if (result[1] == 1)
            {
              clients.text('1 connected log collation client');
            }
            else
            {
              clients.text(d3.format(',')(result[1]) + ' connected log collation clients');
            }
          });
      }
  })();
