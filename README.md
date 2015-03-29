# Dreamhost DNS Update

A simple Node script I put together to automatically update the DNS A record for my home server with the current dynamic IP address. Based on [Dreamhost DNS Updater](https://github.com/nfriedly/node-dreamhost-dns-updater) and the [Dreamhost DNS API](http://wiki.dreamhost.com/API/Dns_commands).

## Installation

Install dependencies

    npm install

Specify the record to update and Dreamhost API key in `config.js`

    module.exports = {
    	hostname: "example.domain.com",
    	key: "DREAMHOST API KEY"
    };

## Command-line usage

To run immediately

    $ node update.js

## LaunchAgent usage (OSX)

To run automatically, create a launch agent, e.g. `~/Library/LaunchAgents/com.example.dh-dns-update.plist`

    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.example.dh-dns-update</string>
        <key>ProgramArguments</key>
        <array>
          <string>/usr/local/bin/node</string>
          <string>/path/to/dh-dns-update/update.js</string>
        </array>
        <key>StandardOutPath</key>
        <string>/path/to/dh-dns-update/status.log</string>
        <key>StandardErrorPath</key>
        <string>/path/to/dh-dns-update/status.log</string>
        <key>StartInterval</key>
        <integer>43200</integer>
      </dict>
    </plist>

Then load the plist file

    launchctl load ~/Library/LaunchAgents/com.example.dh-dns-update.plist

A verify it works by running

    launchctl start com.example.dh-dns-update`

Finally, check out `status.log` to make sure everything is working properly.
