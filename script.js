var skt = new WebSocket('ws://' + location.host + '/skt');

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
