var skt = new WebSocket('ws://' + location.host + '/skt');

jQuery(function ($)
  {
    skt.onmessage = function (evt)
      {
        var delta = JSON.parse(evt.data);
        jQuery.each(delta, function ()
          {
            var $tr = $('#' + this[0].replace(/\./g, '\\.'));
            if ($tr.length)
            {
              $tr.replaceWith('<tr id="' + this[0] + '"><td>' + this.join('</td><td>') + '</td></tr>');
            }
            else
            {
              $('<tr id="' + this[0] + '"><td>' + this.join('</td><td>') + '</td></tr>').appendTo('tbody');
            }
          });
      }
  });
