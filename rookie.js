/**
 * Rookie.js v0.0.1
 * (c) 2014 wangyi
 */
(function (window) {
    'use strict';

    var timing = window.performance.timing;
    window.rookie = window.rookie || {

        navTiming: timing,

        getMainDocTimes: function () {
            var times = {};

            if (timing) {
                /*网络耗时*/
                times.networkTime = timing.responseEnd - timing.fetchStart;

                /*前端耗时*/
                times.frontendTime = timing.loadEventEnd - timing.responseEnd;

                /*页面加载总耗时*/
                times.totalTime = timing.loadEventEnd - timing.navigationStart;
            }

            return times;
        },

        printTable: function (data) {
            var table = {};
            Object.keys(data).sort().forEach(function (i) {
                table[i] = {
                    ms: data[i]
                };
            });
            console.table(table);
        }

    };

    window.onload = function () {
        setTimeout(function () {
            rookie.printTable(rookie.getMainDocTimes());
            rookie.printTable(rookie.navTiming);
        }, 0);
    };

})(this);