/**
 Dreamhost DNS updater.

*/

/* jslint node: true */
"use strict";

// dependencies
var curl = require("curlrequest"),
	RSVP = require("RSVP");

// defines hostname to check and Dreamhost API key
var config = require("./config.js");

// used for log output and as the comment if the DNS record is updated
var timestamp = "[" + new Date() + "] ";

// and away we go!
check();

/**
  Check the current IP address and the DNS record and `update()` if necessary
 */
function check() {

	// API calls
	var ipCheckRequest  = "http://api.ipify.org?format=json";
	var dnsCheckRequest = "https://api.dreamhost.com/?cmd=dns-list_records&format=json&key=" + config.key;

	var checks = [request(ipCheckRequest), request(dnsCheckRequest)];
	RSVP.all(checks).then(handleResponses).catch(handleFailures);

	// if both promises resolve
	function handleResponses(responses) {

		// parse API responses
		var ip  = responses[0].ip;
		var dnsRecords = responses[1].data;

		// find DNS record
		var record = "";
		for(var r in dnsRecords) {
			if(dnsRecords[r].record === config.hostname) { record = dnsRecords[r]; }
		}

		// check for missing DNS record
		if(record === "") {
			console.log(timestamp + "No DNS record for %s, adding...", config.hostname);
			addDnsRecord(ip);
		}
		else {
			var dnsLog = "DNS record " + record.value;
			var ipLog = "IP address " + ip;
			var log = timestamp;

			// compare IP addresses
			if(ip === record.value) {
				log += dnsLog + " matches " + ipLog + ", no update required.";
			}
			else {
				log += dnsLog + " does not match " + ipLog +", updating...";
				updateDnsRecord(record.value, ip);
			}
			console.log(log);
		}
	}

	// if a promise rejects (either an API check fails or curl explodes)
	function handleFailures(errors) {
		console.error("Error checking IP addresses:")
		console.error(errors);
	}
}

/**
 Add the new DNS record.

 @param {String} new IP address
*/
function addDnsRecord(newIp) {

	var comment = timestamp + "Updated by dh-dns-update (https://github.com/ryanvarick/dh-dns-update)";
	var addRecordRequest = "https://api.dreamhost.com/" +
		"?cmd=dns-add_record" +
		"&record=" + config.hostname +
		"&type=A" +
		"&value=" + newIp +
		"&comment=" + encodeURIComponent(comment) +
		"&format=json" +
		"&key=" + config.key;

	request(addRecordRequest)
		.then(function(response) {
			// console.log("Record added!");
			// console.log(response);
		})
		.catch(function(error) {
			console.error("Error adding DNS record:");
			console.error(error);
		})
}

/**
 Update the DNS record with the new IP address.

 The Dreamhost API does not support direct updates. The old record must first be
 dropped, then the new record must be added. The IP address is required to drop
 the original record.

 @param {String} old IP address
 @param {String} new IP address
 */
function updateDnsRecord(oldIp, newIp) {

	var dropRecordRequest = "https://api.dreamhost.com/" +
		"?cmd=dns-remove_record" +
		"&record=" + config.hostname +
		"&type=A" +
		"&value=" + oldIp +
		"&format=json" +
		"&key=" + config.key;

	request(dropRecordRequest)
		.then(addDnsRecord(newIp))
		.catch(function(error) {
			console.error("Error dropping DNS record:");
			console.error(error);
		});
}


/**
 Requests the given `url`, which should be an API that returns a JSON response.

 This basically just wraps a curl request in a promise, with a bit of extra
 handling for Dreamhost API errors.

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
