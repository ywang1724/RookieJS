/**
 * Rookie.js v0.0.1
 * Copyright (c) 2014 wangyi
 */
window.onload = function () {
    'use strict';

    /*定义变量*/
    var rookie = {
        errors: []
    };

    /*浏览器支持检测*/

    //检测是否支持Navigation Timing API
    if (window.performance.timing) {
        rookie.timings = window.performance.timing;
    } else {
        rookie.errors.push("浏览器不支持Navigation Timing API！");
    }

    //检测是否支持Resource Timing API
    if (window.performance.getEntriesByType) {
        rookie.resources = window.performance.getEntriesByType("resource");
    } else {
        rookie.errors.push("浏览器不支持Resource Timing API！");
    }

    /*为什么此时页面还未完成加载？*/
    ////检测页面是否加载完成
    //if (rookie.timings.loadEventEnd - rookie.timings.navigationStart < 0) {
    //    rookie.errors.push("页面还在加载，获取数据失败！");
    //}

    /*Rookie工具包*/
    var rookieUtils = {

        /**
         * 主文档监测
         * @param navTiming(PerformanceTiming Object)
         * @returns {{}}
         */
        getMainDocTimes: function (navTiming) {
            var mainDoc = {};

            mainDoc.href = window.location.href;
            var pathname = window.location.pathname;
            var lastIndex = pathname.lastIndexOf('/');
            mainDoc.path = pathname.substring(0, lastIndex);
            mainDoc.name = pathname.substring(lastIndex + 1);

            if (mainDoc) {
                mainDoc.networkTime = navTiming.responseEnd - navTiming.fetchStart;  //网络耗时
                mainDoc.frontendTime = navTiming.loadEventEnd - navTiming.responseEnd;  //前端耗时
                mainDoc.totalTime = navTiming.loadEventEnd - navTiming.navigationStart;  //页面加载总耗时
            }

            return mainDoc;
        },

        /**
         * 资源监测
         * @param resTimings(PerformanceResourceTiming Object)
         * @returns {Array}
         */
        getResourceTimes: function (resTimings) {
            var resources = [];
            for (var i = 0; i < resTimings.length; i++) {
                var obj = {};
                obj.totalTime = resTimings[i].duration;
                obj.href = resTimings[i].name;
                var lastIndex = resTimings[i].name.lastIndexOf('/'),
                    index3 = resTimings[i].name.indexOf('/', 8);
                obj.name = resTimings[i].name.substring(lastIndex + 1);
                obj.path = resTimings[i].name.substring(index3 + 1, lastIndex);
                resources.push(obj);
            }
            return resources;
        },

        /**
         * 生成Waterfall数据
         * @param navTiming(PerformanceTiming Object)
         * @param resTimings(PerformanceResourceTiming Object)
         * @returns {{}}
         */
        generateData: function (navTiming, resTimings) {
            var data = {
                name: [],
                totalTime: []
            };
            var mainDoc = rookieUtils.getMainDocTimes(navTiming);
            data.name.push(mainDoc.name);
            data.totalTime.push(mainDoc.totalTime);
            for (var i = 0; i < resTimings.length; i++) {
                var obj = {};
                obj.totalTime = resTimings[i].duration;
                obj.href = resTimings[i].name;
                var lastIndex = resTimings[i].name.lastIndexOf('/'),
                    index3 = resTimings[i].name.indexOf('/', 8);
                obj.name = resTimings[i].name.substring(lastIndex + 1);
                obj.path = resTimings[i].name.substring(index3 + 1, lastIndex);
                data.name.push(obj.name);
                data.totalTime.push(obj.totalTime);
            }
            return data;
        },

        /**
         * 控制台表格输出
         * @param data(Object)
         */
        printTable: function (data) {
            var table = {};
            Object.keys(data).sort().forEach(function (i) {
                table[i] = {
                    ms: data[i]
                };
            });
            console.table(table);
        },

        /**
         * 瀑布流输出
         * @param data
         */
        drawWaterfall: function (data) {
            $('#container').highcharts({
                chart: {
                    type: 'bar'
                },
                title: {
                    text: '页面加载瀑布流'
                },
                subtitle: {
                    text: 'Beta v0.0.1'
                },
                xAxis: {
                    categories: data.name,
                    title: {
                        text: '加载文件'
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: '时间 (ms)',
                        align: 'high'
                    },
                    labels: {
                        overflow: 'justify'
                    }
                },
                tooltip: {
                    valueSuffix: ' ms'
                },
                plotOptions: {
                    bar: {
                        dataLabels: {
                            enabled: true
                        }
                    }
                },
                legend: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                series: [{
                    name: '总时间',
                    data: data.totalTime
                }]
            });
        }

    };

    /*利用工具包分析页面加载数据调用（beta）*/
    setTimeout(function () {
        //检测页面是否加载完成
        if (rookie.timings.loadEventEnd - rookie.timings.navigationStart < 0) {
            rookie.errors.push("页面还在加载，获取数据失败！");
        }
        if (rookie.errors.length > 0) {
            for (var item in rookie.errors) {
                alert(rookie.errors[item]);
            }
            rookieUtils.printTable(rookie.timings);
        } else {
            //rookieUtils.printTable(rookieUtils.getMainDocTimes(rookie.timings));
            //rookieUtils.printTable(rookie.timings);
            rookieUtils.drawWaterfall(rookieUtils.generateData(rookie.timings, rookie.resources));
        }
    }, 0);

};