/**
  Dreamhost DNS updater.

  Based on Dreamhost DNS Updater:
  - https://github.com/nfriedly/node-dreamhost-dns-updater

  See:
  - http://wiki.dreamhost.com/API/Dns_commands

  Notes:
  - Dreamhost returns objects in { result: "string", data: ... } format,
    but the script does not currenlty check for API errors
 */

/* jslint node: true */
"use strict";

// third-party dependencies
var curl = require("curlrequest"),
	RSVP = require("RSVP");

// first-party dependencies
var config = require("./config.js");

/**
  Checks the current IP address and the DNS record IP address,
  calling `update()` if necessary and exiting if not.
 */
function check() {
	var now = new Date();
	console.log("[%s%s%s %s:%s] Starting update...",
		now.getFullYear(), (now.getMonth() + 1), now.getDate(),
		now.getHours(), now.getMinutes());

	var ipCheck  = "http://api.ipify.org?format=json";
	var dnsCheck = "https://api.dreamhost.com/?cmd=dns-list_records&format=json&key=" + config.key;

	// check current IP address and DNS record IP address
	var checks = [request(ipCheck), request(dnsCheck)];
	RSVP.all(checks).then(handleResponses).catch(handleFailures);

	function handleResponses(responses) {
		// parse API responses
		var ip  = responses[0].ip;
		var dns = responses[1].data;

		// find DNS record
		var record = "";
		for(var entry in dns) {
			if(dns[entry].record === config.hostname) { record = dns[entry]; }
		}

		// check for missing DNS reocrd
		if(record === "") {
			console.error("Error: DNS record for %s not found", config.hostname);
			return;
		}

		// compare IP addresses
		var record = record.value;
		if(ip === record) console.log("> IPs match, exiting.");
		else update(ip, record);
	}
	function handleFailures(errors) {
		console.error("Error: IP address check failed:")
		console.error(errors);
	}
}

/**
  Updates the DNS record with the new IP address. The Dreamhost API requires
  the old IP address to drop the current DNS record.

  @param {String} old IP address
  @param {String} new IP address
 */
function update(oldIp, newIp) {

	var dropRecord = "https://api.dreamhost.com/" +
		"?cmd=dns-remove_record" +
		"&record=" + config.hostname +
		"&type=A" +
		"&value=" + oldIp +
		"&format=json" +
		"&key=" + config.key;

	var addRecord = "https://api.dreamhost.com/" +
		"?cmd=dns-add_record" +
		"&record=" + config.hostname +
		"&type=A" +
		"&value=" + newIp +
		"&format=json" +
		"&key=" + config.key;

	// drop the old DNS record and add the updated record
	var updates = [request(dropRecord), request(addRecord)];
	RSVP.all(updates).then(handleResponses).catch(handleFailures);

	function handleResponses(responses) {
		// console.log(responses);
	}
	function handleFailures(errors) {
		console.error("Error: Failed to update DNS record:");
		console.error(errors);
	}
}


/**
  Requests the given `url`, which should be an API that returns a JSON response.

  @param {String} URL of the API request
  @return {Promise}
 */
function request(url) {
	return new RSVP.Promise(function(resolve, reject) {
		var options = { "url": url };
		curl.request(options, function(err, stdout, meta) {

			// check for curl errors
			if(err) reject({ "error": err, "url": url });
			else {
				var response = JSON.parse(stdout);

				// check for DH API errors
				if(response.result === "error") reject({ "error": response, "url": url });
				else resolve(response);
			}
		});
	});
}

check();
