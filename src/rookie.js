/**
 * Rookie.js v0.0.1
 * Copyright (c) 2014 wangyi
 */
$(window).load(function () {
    'use strict';

    /*定义变量*/
    var rookie = {
        errors: []
    };

    /*浏览器支持检测*/
    if (window.performance.timing) {
        rookie.timings = window.performance.timing;
    } else {
        rookie.errors.push("浏览器不支持Navigation Timing API！");
    }

    if (window.performance.getEntriesByType) {
        rookie.resources = window.performance.getEntriesByType("resource");
    } else {
        rookie.errors.push("浏览器不支持Resource Timing API！");
    }

    if (rookie.timings.loadEventEnd - rookie.timings.navigationStart < 0) {
        rookie.errors.push("页面还在加载！请加载完成后重试。");
    }

    var rookieUtils = {

        /*主文档监测*/
        getMainDocTimes: function (navTiming) {
            var times = {};

            if (times) {
                //网络耗时
                times.networkTime = navTiming.responseEnd - navTiming.fetchStart;

                //前端耗时
                times.frontendTime = navTiming.loadEventEnd - navTiming.responseEnd;

                //页面加载总耗时
                times.totalTime = navTiming.loadEventEnd - navTiming.navigationStart;
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

        /*资源监测*/

    };

    setTimeout(function () {
        rookieUtils.printTable(rookieUtils.getMainDocTimes(rookie.timings));
        rookieUtils.printTable(rookie.timings);
    }, 0);

});