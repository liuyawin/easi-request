var count = 0;
function noop(){}
/**
 * @param {String} url
 * @param {Object} opts
 * @param {Number} index
 * @param {Function} success 
 * @param {Function} error 
 */
function jsonp(url, opts, index, success, error) {
    if (typeof opts == 'function') {
        success = opts;
        error = success;
        opts = {};
    }

    if (!opts) {
        opts = {};
    }

    var prefix = opts.prefix || '__jp';
    var id = opts.jsonpCallback || (prefix + (count++));

    var jsonp = opts.jsonp || 'callback';
    var timeout = opts.timeout != null ? opts.timeout : 60000;
    var enc = encodeURIComponent;
    var target = document.getElementsByTagName('script')[0] || document.head;
    var script;
    var timer;

    if (timeout) {
        timer = setTimeout(function () {
            cleanup();
            if (fn) {
                fn(new Error('timeout'));
            }
        }, timeout);
    }

    function cleanup() {
        if (script.parentNode) {
            script.parentNode.removeChild(script);
            window[id] = noop;
            if (timer) {
                clearTimeout(timer);
            }
        }
    }

    function cancel() {
        if (window[id]) {
            cleanup();
        }
    }

    window[id] = function (data) {
        cleanup();
        if (success) {
            success.call(null, data, index);
        }
    }

    url += (~url.indexOf('?') ? '&' : '?') + jsonp + '=' + enc(id);
    url.replace('?&', '?');

    if(opts.params){
        for (var key in opts.params) {
            if (opts.params.hasOwnProperty(key)) {
                url += '&' + key + '=' + opts.params[key];
            }
        }
    }

    script = document.createElement('script');
    script.src = url;
    target.parentNode.insertBefore(script, target);

    script.onerror = function(err){
        cleanup();
        error(err, index);
    }

    return cancel;
}

module.exports = jsonp;