/* 
Copyright (c) 2015, Yahoo Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.

Authors: Nera Liu <neraliu@yahoo-inc.com>
         Albert Yu <albertyu@yahoo-inc.com>
         Adonis Fung <adon@yahoo-inc.com>
*/
var Handlebars = require('handlebars'),
    ContextParserHandlebars = require("context-parser-handlebars"),
    xssFilters = require('xss-filters');

function preprocess(template) {
    try {
        if (template) {
            var parser = new ContextParserHandlebars({printCharEnable: false});
            return parser.analyzeContext(template);
        }
    } catch (err) {
        console.log('=====================');
        console.log("[WARNING] SecureHandlebars: falling back to the original template");
        Object.keys(err).forEach(function(k){console.log(k.toUpperCase() + ':\n' + err[k]);});
        console.log("TEMPLATE:\n" + template);
        console.log('=====================');
    }
    return template;
}

function override(h) {
    var c = h.compile, 
        pc = h.precompile,
        privateFilters = xssFilters._privFilters;

    // override precompile function to preprocess the template first
    h.precompile = function (template, options) {
        return pc.call(this, preprocess(template), options);
    };

    // override compile function to preprocess the template first
    h.compile = function (template, options) {
        return c.call(this, preprocess(template), options);
    };

    // register below the filters that are automatically applied by context parser 
    [
        'y',
        'yd', 'yc', 
        'yavd', 'yavs', 'yavu',
        'yu', 'yuc',
        'yubl', 'yufull'
    ].forEach(function(filterName){
        h.registerHelper(filterName, privateFilters[filterName]);
    });

    // register below the filters that might be manually applied by developers
    [
        'inHTMLData', 'inHTMLComment',
        'inSingleQuotedAttr', 'inDoubleQuotedAttr', 'inUnQuotedAttr',
        'uriInSingleQuotedAttr', 'uriInDoubleQuotedAttr', 'uriInUnQuotedAttr', 'uriInHTMLData', 'uriInHTMLComment',
        'uriPathInSingleQuotedAttr', 'uriPathInDoubleQuotedAttr', 'uriPathInUnQuotedAttr', 'uriPathInHTMLData', 'uriPathInHTMLComment',
        'uriQueryInSingleQuotedAttr', 'uriQueryInDoubleQuotedAttr', 'uriQueryInUnQuotedAttr', 'uriQueryInHTMLData', 'uriQueryInHTMLComment',
        'uriComponentInSingleQuotedAttr', 'uriComponentInDoubleQuotedAttr', 'uriComponentInUnQuotedAttr', 'uriComponentInHTMLData', 'uriComponentInHTMLComment',
        'uriFragmentInSingleQuotedAttr', 'uriFragmentInDoubleQuotedAttr', 'uriFragmentInUnQuotedAttr', 'uriFragmentInHTMLData', 'uriFragmentInHTMLComment'
    ].forEach(function(filterName){
        h.registerHelper(filterName, xssFilters[filterName]);
    });
    return h;
}

if (module && module.exports) {
    module.exports = override(Handlebars.create());
} else { 
    override(Handlebars);
}
