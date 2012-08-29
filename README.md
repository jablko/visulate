Visulate
========

This is a web app to visualize statistics about [the Apache Traffic Server](http://trafficserver.apache.org/) caching proxy in real time, with [the log collation](http://trafficserver.apache.org/docs/trunk/admin/working-log-files/#CollatingEventLogFiles) feature, [WebSocket](http://en.wikipedia.org/wiki/WebSocket), and [the D3 JavaScript library](http://d3js.org/)


Install
-------

The code is up on GitHub. You can either download [a zip archive](https://github.com/jablko/visulate/zipball/master), or download the code with Git:

    $ git clone https://github.com/jablko/visulate.git

This script employs [the Twisted WebSocket server support](http://twistedmatrix.com/trac/ticket/4173), which isn't merged yet. You will need to install [Twisted](http://twistedmatrix.com/trac/), and then save [this file, websockets.py](http://twistedmatrix.com/trac/export/34546/branches/websocket-4173-3/twisted/web/websockets.py), in the same directory as the script (or anywhere else in [the Python module search path](http://docs.python.org/tutorial/modules#the-module-search-path))

You will also need to save [this file, d3.v2.min.js](http://d3js.org/d3.v2.min.js), in the same directory as the script, for the D3 JavaScript library

To configure Traffic Server to send log entries to this script, follow the instructions in the Administrator's Guide to [enable log collation](http://trafficserver.apache.org/docs/trunk/admin/working-log-files/#CollatingEventLogFiles). Edit `records.config` and set `proxy.local.log.collation_mode` to `2` to send log entries to a log collation server

    LOCAL proxy.local.log.collation_mode INT 2

Set `proxy.config.log.collation_host` to the hostname or address of the machine running this script. You can run this script on a different machine from the one running Traffic Server

    CONFIG proxy.config.log.collation_host STRING example

By default, this script listens for connections from web browsers on port 6011 and for connections from Traffic Server log collation clients on port 8085. Traffic Server connects to a log collation server on port 8085 by default, so you shouldn't need to configure `proxy.config.log.collation_port`

    CONFIG proxy.config.log.collation_port INT 8085

Run the script and visit port 6011 with a web browser, e.g. http://localhost:6011

    $ visulate/visulate


About
-----

This script is useful if you want to access up to date statistics about Apache Traffic Server with a web browser. If you run a forward proxy and are currently experiencing poor network performance, it might help identify the cause. Because it's accessed with a web browser, it might make it easier to view statistics than with tools like `traffic_logstats`. It also makes it simple to do log analysis on a different machine from the one running Traffic Server

Traffic Server has a built in feature to reliably send binary log entries to another Traffic Server instance, to collate logs for a cluster of nodes in one place. This script exploits this feature, it attempts to parse these binary log entries and maintain up to date statistics. As a bonus, because it receives log entries in (near) real time, it also exploits WebSocket to update statistics in connected web browsers in real time

The script displays the number of connected log collation clients. If the web browser becomes disconnected from the script, it will periodically try to reconnect [with truncated binary exponential backoff](http://en.wikipedia.org/wiki/Exponential_backoff#Binary_exponential_backoff_.2F_truncated_exponential_backoff)

Currently the only available statistics are byte counts by client, but here are some ideas for additional statistics to add in future

* Request counts as well as byte counts
* Counts by destination as well as by client
* Hit/miss statistics
* Totals of sliding windows, like last ten minutes
* Time series as well as comparison of totals
* Statistics [like Squidpeek](https://github.com/mnot/squidpeek)
* Statistics [like Calamaris](http://cord.de/tools/squid/calamaris/)
* Sorting and limiting, like top ten byte counts

This Wikipedia article [on Edward Tufte](http://en.wikipedia.org/wiki/Edward_Tufte) also provides some inspiration, such as the small multiple

> A chart with many series shown on a single pair of axes can often be easier to read when displayed as several separate pairs of axes placed next to each other

The original inspiration for employing Twisted was to also use [the Python RRDtool bindings](http://oss.oetiker.ch/rrdtool/prog/rrdpython.en.html) and store statistics in a round-robin database instead of memory, however I haven't yet [figured out how](http://thread.gmane.org/gmane.comp.db.rrdtool.user/18737) to do this. [node.js](http://nodejs.org/) could be substituted for Twisted


Example
-------

Here is [an example of what it currently looks like](http://nottheoilrig.com/visulate/). This example is just a snapshot and isn't updated in real time
