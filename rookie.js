/**
 * Rookie.js v0.0.1
 * (c) 2014 wangyi
 */
(function (window) {
    'use strict';

    window.rookie = window.rookie || {

        getMainDocTimes: function () {
            var timing = window.performance.timing;
            var times = {};

            if (timing) {
                /*网络耗时*/
                times.networkTime = timing.requestStart - timing.navigationStart;

                /*后端耗时*/
                times.backendTime = timing.responseEnd - timing.requestStart;

                /*前端耗时*/
                times.frontendTime = timing.loadEventEnd - timing.domLoading;
            }
            console.log(times);
            //console.log(timing);
            return times;
        }

    };

    return setTimeout(function () {
        rookie.getMainDocTimes();
    }, 0);

})(this);