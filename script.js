var skt = new WebSocket('ws://localhost:6011/skt');

jQuery(function ($)
  {
    skt.onmessage = function (evt)
      {
        var row = JSON.parse(evt.data);

        $('<tr><td>' + row.join('</td><td>') + '</td></tr>').appendTo('tbody');
      }
  });
