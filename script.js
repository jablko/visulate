var skt = new WebSocket('ws://' + location.host + '/skt');

skt.onmessage = function (evt)
  {
    var delta = JSON.parse(evt.data);
    delta.forEach(function (itm)
      {
        // http://www.w3.org/TR/CSS21/syndata#value-def-identifier
        var tr = d3.select('#\\00003' + itm[0].replace(/\./g, '\\.'));
        if (tr.empty())
        {
          d3.select('tbody').append('tr').attr('id', itm[0]).selectAll('td')
              .data(itm)
            .enter().append('td')
              .text(function (d) { return d; });
        }
        else
        {
          tr.selectAll('td')
            .data(itm)
            .text(function (d) { return d; });
        }
      });
  }
