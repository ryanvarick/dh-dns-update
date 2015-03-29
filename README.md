# Dreamhost DNS Update

A simple Node script I put together to automatically update the DNS A record for my home server with the current dynamic IP address. Based on [Dreamhost DNS Updater](https://github.com/nfriedly/node-dreamhost-dns-updater) and the [Dreamhost DNS API](http://wiki.dreamhost.com/API/Dns_commands).

## Usage

Install dependencies:

    npm install

Specify the record to update and Dreamhost API key in `config.js`:

    module.exports = {
    	hostname: "example.domain.com",
    	key: "DREAMHOST API KEY"
    };

To run immediately:

    `$ node update.js`

To run automatically, create a launch agent in `~/Library/LaunchAgents`.
