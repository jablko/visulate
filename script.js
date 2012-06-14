var skt = new WebSocket('ws://localhost:6011/skt');

jQuery(function ($)
  {
    skt.onmessage = function (evt)
      {
        var row = JSON.parse(evt.data);

        var $tr = $('#' + row[0].replace(/\./g, '\\.'));
        if ($tr.length)
        {
          $tr.replaceWith('<tr id="' + row[0] + '"><td>' + row.join('</td><td>') + '</td></tr>');
        }
        else
        {
          $('<tr id="' + row[0] + '"><td>' + row.join('</td><td>') + '</td></tr>').appendTo('tbody');
        }
      }
  });
