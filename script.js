var status = d3.select('body').append('div');

var backoff = 1;

(function connect()
  {
    status.text('Connecting...');

    var skt = new WebSocket('ws://' + location.host + '/skt');

    skt.onclose = function ()
      {
        status.text('Disconnected');

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
        JSON.parse(evt.data).forEach(function (itm)
          {
            // http://www.w3.org/TR/CSS21/syndata#value-def-identifier
            var tr = d3.select('#\\00003' + itm[0].replace(/\./g, '\\.'));
            if (tr.empty())
            {
              tr = d3.select('tbody').append('tr').attr('id', itm[0]);
            }

            var td = tr.selectAll('td').data(itm);

            td.enter().append('td');

            td.text(function (d) { return d; });
          });
      }

    skt.onopen = function ()
      {
        status.text('Connected.');

        backoff = 1;
      }
  })();
