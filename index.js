const axios = require('axios');
const jsonp = require('./jsonp.js');
/**
 * 
 * @param {Object|Array} opts 选项
 * @param {Obejct} cbs 回调数组
 */
function request(opts, cbs, isAll) {
    var isOptsArr;//选项是否为数组
    var optsArr;//选项数组
    var doneCount = 0;
    var isDone = false;//是否已完成
    var resultArr = [];//返回结果列表
    // var cancelArr = [];//取消请求函数列表
    if (!opts) {
        console.error('请传入配置项');
        return;
    }

    if (typeof cbs === 'boolean') {
        cbs = {};
        isAll = cbs;
    } else if (typeof cbs != 'object') {
        cbs = {};
    }

    if (isAll === undefined) {
        isAll = true;
    }

    if (cbs.beforeSend) {
        cbs.beforeSend.call(opts.context || null);
    }

    if (typeof opts === 'string') {
        opts = { url: opts }
    }

    if (opts instanceof Array) {
        isOptsArr = true;
        optsArr = opts;
    } else {
        isOptsArr = false;
        optsArr = [opts];
    }

    for (var i = 0; i < optsArr.length; i++) {
        var opt = optsArr[i];
        if (typeof opt === 'string') {
            optsArr[i] = { url: opt }
        } else if (!opt.url) {
            console.error('url不能为空');
            return;
        }
    }
    //执行发送请求之前的回调
    if (cbs.beforeSend) {
        cbs.beforeSend.call(opts.context || null);
    }
    //构造成功失败回调函数
    var successCb = function (res) {
        if (cbs.success) {
            cbs.success.call(opts.context, res);
        }
        if (cbs.complete) {
            cbs.complete.call(opts.context, res);
        }
    }
    var errorCb = function (err) {
        if (cbs.error) {
            cbs.error.call(opts.context, err);
        }
        if (cbs.complete) {
            cbs.complete.call(opts.context, err);
        }
    }
    //发送请求
    for (var i = 0; i < optsArr.length; i++) {
        var opt = optsArr[i];
        var cancelFun = _doRequest(opt, i, cbs,
            function (res, index) {
                if (!isOptsArr) {
                    successCb(res);
                } else {
                    if (isAll && !isDone) {
                        resultArr[index] = res;
                        doneCount++;
                        if (doneCount === optsArr.length) {
                            isDone = true;
                            successCb(resultArr);
                        }
                    } else {
                        if (!isDone) {
                            isDone = true;
                            successCb(res);
                        }
                    }
                }
            },
            function (err, index) {
                isDone = true;
                errorCb(err, index);
            }
        );
        // cancelArr.push(cancelFun);
    }

    function cancel() {
        //将还未返回的请求取消掉
        // for (var i = 0; i < optsArr.length; i++) {
        //     if(resultArr[i]){
        //         var fun = cancelArr[i];
        //         if(typeof fun === 'function'){
        //             fun('请求已取消');
        //         }
        //     }
        // }
        isDone = true;
    }

    return cancel;
}
/**
 * 
 * @param {Object} opts 选项
 * @param {Number} index 序号
 * @param {Function} successCb 成功回调
 * @param {Function} errorCb 失败回调
 */
function _doRequest(opts, index, cbs, successCb, errorCb) {
    var cancel;
    if (typeof cbs != 'object') {
        cbs = {};
    }

    if (opts.dataType == 'jsonp') {
        var params = {};
        params.jsonp = opts.jsonp;
        params.jsonpCallback = opts.jsonpCallback;
        params.timeout = opts.timeout;
        params.params = opts.params;

        cancel = jsonp(opts.url, params, index, successCb, errorCb);
    } else {
        opts = Object.assign({
            method: 'get',
            dataType: 'json',
            cache: true,
            header: null,
            contentType: 'text/html; charset=utf-8',
            context: null,
            timeout: 60000,
            cancelToken: new axios.CancelToken(function executor(c) { // 设置 cancel token
                cancel = c;
            }),
            onUploadProgress: function (progressEvent) {
                if (cbs.progress) {
                    cbs.progress.call(opts.context, progressEvent.loaded / progressEvent.total, progressEvent);
                }
            },
            onDownloadProgress: function (progressEvent) {
                if (cbs.progress) {
                    cbs.progress.call(opts.context, progressEvent.loaded / progressEvent.total, progressEvent);
                }
            },
        }, opts);
        axios.request(opts)
            .then(function (res) {
                if (successCb) {
                    successCb(res.data, index);
                }
            })
            .catch(function (err) {
                if (errorCb) {
                    errorCb(err, index);
                }
            });

        // return cancel;
    }
}

module.exports = request;