'use strict';

const MODULE_REQUIRE = 1
    /* built-in */
    , dns = require('dns')
    
    /* NPM */
    , cloneObject = require('jinang/cloneObject')
    , parseOptions = require('jinang/parseOptions')
    , PoC = require('jinang/PoC')
    
    /* in-package */
    , DnsCache = require('./lib/DnsCache')
    ;

/**
 * @param  {object}  options
 * @param  {number} [options.ttl]    Time-To-Live of resolved records (unit: seconds)
 * @param  {string} [options.source] "system" | "network" | <IP>  
 *                                   See READ MORE for more details.
 * 
 * -- READ MORE --
 * https://nodejs.org/dist/latest-v8.x/docs/api/dns.html#dns_implementation_considerations 
 */
const DnsAgentOptions = {
    caseSensitive: false,
    explicit: true,
    columns: [
        'ttl DEFAULT(86400)',
        'source DEFAULT("system")'
    ]
};
function DnsAgent(options) {
    this.options = parseOptions(options, DnsAgentOptions);
    this.cache = new DnsCache( cloneObject(this.options, ['ttl']) );
}

DnsAgent.prototype.lookup4 = function(hostname, callback) {
    return PoC((done) => {
        let ipv4 = this.cache.get(hostname);
        if (ipv4) {
            done(null, ipv4);
        }
        else {
            let callback2 = (err, ipv4, ttl) => {
                if (!err) {
                    this.cache.put(hostname, ipv4, ttl);
                }
                done(err, ipv4);
            };

            if (this.options.source == 'system') {
                dns.lookup(hostname, 4, (err, address, family /* always 4 on success */) => {
                    callback2(err, address);
                });
            }
            else if (this.options.source == 'network') {
                dns.resolve4(hostname, { ttl: this.options.ttl }, (err, addresses) => {
                    err ? callback2(err) : callback2(err, addresses[0].address, addresses[0].ttl);
                });
            }
            else {
                if (dns.Resolver) {
                    let resolver = new dns.Resolver();
                    resolver.setServers([ this.options.source ]);
                    resolver.resolve4(hostname, { ttl: this.options.ttl }, (err, addresses) => {
                        err ? callback2(err) : callback2(err, addresses[0].address, addresses[0].ttl);
                    });
                }
                else {
                    let servers = dns.getServers();
                    dns.setServers([ this.options.source ]);
                    dns.resolve4(hostname, { ttl: this.options.ttl }, (err, addresses) => {
                        // Reset the DNS servers.
                        setImmediate(() => {
                            dns.setServers(servers);
                            err ? callback2(err) : callback2(err, addresses[0].address, addresses[0].ttl);
                        });
                    });
                }
            }
        }
    }, callback);    
};

module.exports = DnsAgent;