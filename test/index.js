'use strict';

const MODULE_REQUIRE = 1
    /* built-in */
    , assert = require('assert')

    /* NPM */

    /* in-package */
    , DnsAgent = require('../DnsAgent')
    ;

describe('DnsAgent', () => {
    it('lookup4', (done) => {
        let agent = new DnsAgent({ ttl: 10 });
        agent.lookup4('localhost', (err, ipv4) => {
            if (err) throw err;
            assert.equal(ipv4, '127.0.0.1');
            done();
        })
    });

    it('resolve via network', (done) => {
        let agent = new DnsAgent({ ttl: 10, source: 'network' });
        agent.lookup4('youngoat.github.io', (err, ipv4) => {
            if (err) throw err;
            assert(ipv4);
            done();
        })
    });
    
    it('use customised server', (done) => {
        let agent = new DnsAgent({ ttl: 10, source: '8.8.8.8' });
        agent.lookup4('youngoat.github.io', (err, ipv4) => {
            if (err) throw err;
            assert(ipv4);
            done();
        })
    });
});