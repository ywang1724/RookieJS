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

            var start = navTiming.navigationStart;
            if (mainDoc) {
                mainDoc.networkTime = navTiming.responseEnd - navTiming.fetchStart;  //网络耗时
                mainDoc.frontendTime = navTiming.loadEventEnd - navTiming.responseEnd;  //前端耗时
                mainDoc.totalTime = navTiming.loadEventEnd - navTiming.navigationStart;  //页面加载总耗时
                mainDoc.dnsTime = navTiming.domainLookupEnd - navTiming.domainLookupStart;
                mainDoc.connectionTime = navTiming.connectEnd - navTiming.connectStart;
                mainDoc.ttfbTime = navTiming.responseStart - navTiming.navigationStart;
                mainDoc.transferTime = navTiming.responseEnd - navTiming.responseStart;

                mainDoc.dns = [navTiming.domainLookupStart - start, navTiming.domainLookupEnd - start];
                mainDoc.connection = [navTiming.connectStart - start, navTiming.connectEnd - start];
                mainDoc.ttfb = [0, navTiming.responseStart - start];
                mainDoc.transfer = [navTiming.responseStart - start, navTiming.responseEnd - start];
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
                obj.startTime = resTimings[i].startTime;

                obj.dns = [Math.round(resTimings[i].domainLookupStart), Math.round(resTimings[i].domainLookupEnd)];
                obj.connection = [Math.round(resTimings[i].connectStart), Math.round(resTimings[i].connectEnd)];
                obj.ttfb = [Math.round(resTimings[i].startTime), Math.round(resTimings[i].responseStart)];
                obj.transfer = [Math.round(resTimings[i].responseStart), Math.round(resTimings[i].responseEnd)];

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
                totalTime: [],
                timeline: [],
                series: [],
                drilldownSeries: []
            };

            function CRDataObj(name, low, high, drilldown) {
                this.name = name || null;
                this.low = low || 0;
                this.high = high || 0;
                this.drilldown = drilldown || "";
            }

            function CRSeriesObj(id, name, data) {
                this.id = id || "";
                this.name = name || null;
                this.data = data || [];
            }

            var mainDoc = rookieUtils.getMainDocTimes(navTiming);
            data.name.push(mainDoc.name);
            data.totalTime.push(mainDoc.totalTime);
            data.timeline.push([0, mainDoc.totalTime]);
            var seriesObj = new CRSeriesObj("", "时间线");
            seriesObj.data.push(new CRDataObj(mainDoc.name, 0, mainDoc.totalTime, mainDoc.name));
            var ddSeriesObjM = new CRSeriesObj(mainDoc.name);
            ddSeriesObjM.data.push(new CRDataObj("dns", mainDoc.dns[0], mainDoc.dns[1]));
            ddSeriesObjM.data.push(new CRDataObj("connection", mainDoc.connection[0], mainDoc.connection[1]));
            ddSeriesObjM.data.push(new CRDataObj("ttfb", mainDoc.ttfb[0], mainDoc.ttfb[1]));
            ddSeriesObjM.data.push(new CRDataObj("transfer", mainDoc.transfer[0], mainDoc.transfer[1]));
            data.drilldownSeries.push(ddSeriesObjM);
            for (var i = 0; i < resTimings.length; i++) {
                var obj = {};
                obj.totalTime = resTimings[i].duration;
                obj.href = resTimings[i].name;
                var lastIndex = resTimings[i].name.lastIndexOf('/'),
                    index3 = resTimings[i].name.indexOf('/', 8);
                obj.name = resTimings[i].name.substring(lastIndex + 1);
                obj.path = resTimings[i].name.substring(index3 + 1, lastIndex);
                data.name.push(obj.name);
                data.totalTime.push(Math.round(obj.totalTime));
                data.timeline.push([Math.round(resTimings[i].startTime), Math.round(resTimings[i].startTime + obj.totalTime)]);
                var low = Math.round(resTimings[i].startTime),
                    high = Math.round(resTimings[i].startTime + obj.totalTime);
                seriesObj.data.push(new CRDataObj(obj.name, low, high, obj.name));

                obj.dns = [Math.round(resTimings[i].domainLookupStart), Math.round(resTimings[i].domainLookupEnd)];
                obj.connection = [Math.round(resTimings[i].connectStart), Math.round(resTimings[i].connectEnd)];
                obj.ttfb = [Math.round(resTimings[i].startTime), Math.round(resTimings[i].responseStart)];
                obj.transfer = [Math.round(resTimings[i].responseStart), Math.round(resTimings[i].responseEnd)];

                var ddSeriesObj = new CRSeriesObj(obj.name);
                ddSeriesObj.data.push(new CRDataObj("dns", obj.dns[0], obj.dns[1]));
                ddSeriesObj.data.push(new CRDataObj("connection", obj.connection[0], obj.connection[1]));
                ddSeriesObj.data.push(new CRDataObj("ttfb", obj.ttfb[0], obj.ttfb[1]));
                ddSeriesObj.data.push(new CRDataObj("transfer", obj.transfer[0], obj.transfer[1]));
                data.drilldownSeries.push(ddSeriesObj);
            }
            data.series.push(seriesObj);
            console.log(JSON.stringify(data.series));
            console.log(JSON.stringify(data.drilldownSeries));
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
         * 条状输出
         * @param data
         */
        drawBar: function (data) {
            $('#container').highcharts({
                chart: {
                    type: 'bar'
                },
                title: {
                    text: '页面加载条'
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
                            enabled: true,
                            formatter: function () {
                                return this.y + ' ms';
                            }
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
        },

        /**
         * 时间线输出
         * @param data
         */
        drawColumnRange: function (data) {
            $('#container').highcharts({
                chart: {
                    type: 'columnrange',
                    inverted: true
                },
                title: {
                    text: '页面加载时间线'
                },
                subtitle: {
                    text: 'Beta v0.0.1'
                },
                xAxis: {
                    type: 'category'
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: '时间 (ms)',
                        align: 'high'
                    }
                },
                tooltip: {
                    formatter: function () {
                        return '<h6>' + this.key + '</h6><br/><table><tr><td>总耗时: </td><td><b>' +
                            (this.point.high - this.point.low) + ' ms' + '</b></td></tr></table>';
                    }
                },
                plotOptions: {
                    columnrange: {
                        dataLabels: {
                            enabled: true,
                            formatter: function () {
                                return this.y + ' ms';
                            }
                        }
                    }
                },
                legend: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                series: data.series,
                drilldown: {
                    series: data.drilldownSeries
                }
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
            rookieUtils.drawColumnRange(rookieUtils.generateData(rookie.timings, rookie.resources));
        }
    }, 0);

};