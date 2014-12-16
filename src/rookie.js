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

                mainDoc.dns = {low: navTiming.domainLookupStart - start, high: navTiming.domainLookupEnd - start};
                mainDoc.connection = {low: navTiming.connectStart - start, high: navTiming.connectEnd - start};
                mainDoc.ttfb = {low: 0, high: navTiming.responseStart - start};
                mainDoc.transfer = {low: navTiming.responseStart - start, high: navTiming.responseEnd - start};
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

                obj.dnsTime = Math.round(resTimings[i].domainLookupEnd - resTimings[i].domainLookupStart);
                obj.connectionTime = Math.round(resTimings[i].connectEnd - resTimings[i].connectStart);
                obj.ttfbTime = Math.round(resTimings[i].responseStart - resTimings[i].startTime);
                obj.transferTime = Math.round(resTimings[i].responseEnd - resTimings[i].responseStart);

                obj.dns = {low: Math.round(resTimings[i].domainLookupStart), high: Math.round(resTimings[i].domainLookupEnd)};
                obj.connection = {low: Math.round(resTimings[i].connectStart), high: Math.round(resTimings[i].connectEnd)};
                obj.ttfb = {low: Math.round(resTimings[i].startTime), high: Math.round(resTimings[i].responseStart)};
                obj.transfer = {low: Math.round(resTimings[i].responseStart), high: Math.round(resTimings[i].responseEnd)};

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

            /**
             * data对象构造函数
             * @param name
             * @param number
             * @param drilldown
             * @constructor
             */
            function DataObj(name, number, drilldown) {
                this.name = name;
                switch (typeof number) {
                    case "number":
                        this.y = number;
                        break;
                    case "object":
                        this.low = number.low;
                        this.high = number.high;
                }
                this.drilldown = drilldown;
            }

            /**
             * series对象构造函数
             * @param id
             * @param name
             * @param data
             * @constructor
             */
            function SeriesObj(id, name, data) {
                this.id = id;
                this.name = name;
                this.data = data || [];
            }

            var mainDoc = rookieUtils.getMainDocTimes(navTiming);   //主文档timing
            data.name.push(mainDoc.name);
            data.totalTime.push(mainDoc.totalTime);
            data.timeline.push([0, mainDoc.totalTime]);
            var seriesObj = new SeriesObj("", "时间线");
            seriesObj.data.push(new DataObj(mainDoc.name, {low: 0, high: mainDoc.totalTime}, mainDoc.name));
            var ddSeriesObjM = new SeriesObj(mainDoc.name);
            ddSeriesObjM.data.push(new DataObj("dns", mainDoc.dns));
            ddSeriesObjM.data.push(new DataObj("connection", mainDoc.connection));
            ddSeriesObjM.data.push(new DataObj("ttfb", mainDoc.ttfb));
            ddSeriesObjM.data.push(new DataObj("transfer", mainDoc.transfer));
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
                seriesObj.data.push(new DataObj(obj.name, {low: low, high: high}, obj.name));

                obj.dns = {low: Math.round(resTimings[i].domainLookupStart), high: Math.round(resTimings[i].domainLookupEnd)};
                obj.connection = {low: Math.round(resTimings[i].connectStart), high: Math.round(resTimings[i].connectEnd)};
                obj.ttfb = {low: Math.round(resTimings[i].startTime), high: Math.round(resTimings[i].responseStart)};
                obj.transfer = {low: Math.round(resTimings[i].responseStart), high: Math.round(resTimings[i].responseEnd)};

                var ddSeriesObj = new SeriesObj(obj.name);
                ddSeriesObj.data.push(new DataObj("dns", obj.dns));
                ddSeriesObj.data.push(new DataObj("connection", obj.connection));
                ddSeriesObj.data.push(new DataObj("ttfb", obj.ttfb));
                ddSeriesObj.data.push(new DataObj("transfer", obj.transfer));
                data.drilldownSeries.push(ddSeriesObj);
            }
            data.series.push(seriesObj);
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
        },

        drawCharts: function () {
            var chart,
                colors = Highcharts.getOptions().colors,
                categories = ['MSIE', 'Firefox', 'Chrome', 'Safari', 'Opera'],
                name = 'Browser brands';
            /*data = [{
             y: 55.11,
             color: colors[0],
             drilldown: {
             name: 'MSIE versions',
             categories: ['MSIE 6.0', 'MSIE 7.0', 'MSIE 8.0', 'MSIE 9.0'],
             data: [10.85, 7.35, 33.06, 2.81],
             color: colors[0]
             }
             }, {
             y: 21.63,
             color: colors[1],
             drilldown: {
             name: 'Firefox versions',
             categories: ['Firefox 2.0', 'Firefox 3.0', 'Firefox 3.5', 'Firefox 3.6', 'Firefox 4.0'],
             data: [0.20, 0.83, 1.58, 13.12, 5.43],
             color: colors[1]
             }
             }, {
             y: 11.94,
             color: colors[2],
             drilldown: {
             name: 'Chrome versions',
             categories: ['Chrome 5.0', 'Chrome 6.0', 'Chrome 7.0', 'Chrome 8.0', 'Chrome 9.0',
             'Chrome 10.0', 'Chrome 11.0', 'Chrome 12.0'],
             data: [0.12, 0.19, 0.12, 0.36, 0.32, 9.91, 0.50, 0.22],
             color: colors[2]
             }
             }, {
             y: 7.15,
             color: colors[3],
             drilldown: {
             name: 'Safari versions',
             categories: ['Safari 5.0', 'Safari 4.0', 'Safari Win 5.0', 'Safari 4.1', 'Safari/Maxthon',
             'Safari 3.1', 'Safari 4.1'],
             data: [4.55, 1.42, 0.23, 0.21, 0.20, 0.19, 0.14],
             color: colors[3]
             }
             }, {
             y: 2.14,
             color: colors[4],
             drilldown: {
             name: 'Opera versions',
             categories: ['Opera 9.x', 'Opera 10.x', 'Opera 11.x'],
             data: [0.12, 0.37, 1.65],
             color: colors[4]
             }
             }];*/

            function setChart(options) {
                chart.series[0].remove(false);
                chart.addSeries({
                    type: options.type,
                    name: options.name,
                    data: options.data,
                    color: options.color || 'white'
                }, false);
                chart.xAxis[0].setCategories(options.categories, false);
                chart.redraw();
            }

            chart = new Highcharts.Chart({
                chart: {
                    renderTo: 'container'
                },
                title: {
                    text: 'Browser market share, April, 2011'
                },
                subtitle: {
                    text: 'Click the columns to view versions. Click again to view brands.'
                },
                xAxis: {
                    categories: categories
                },
                yAxis: {
                    title: {
                        text: 'Total percent market share'
                    }
                },
                plotOptions: {
                    series: {
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function () {
                                    var drilldown = this.drilldown;
                                    var options;
                                    if (drilldown) { // drill down
                                        options = {
                                            'name': drilldown.name,
                                            'categories': drilldown.categories,
                                            'data': drilldown.data,
                                            'color': drilldown.color,
                                            'type': 'pie'
                                        };
                                    } else { // restore
                                        options = {
                                            'name': name,
                                            'categories': categories,
                                            'data': data,
                                            'type': 'column'
                                        };
                                    }
                                    setChart(options);
                                }
                            }
                        },
                        dataLabels: {
                            enabled: true,
                            color: colors[0],
                            style: {
                                fontWeight: 'bold'
                            },
                            formatter: function () {
                                return this.y + '%';
                            }
                        }
                    }
                },
                tooltip: {
                    formatter: function () {
                        var point = this.point,
                            s = this.x + ':<b>' + this.y + '% market share</b><br/>';
                        if (point.drilldown) {
                            s += 'Click to view ' + point.category + ' versions';
                        } else {
                            s += 'Click to return to browser brands';
                        }
                        return s;
                    }
                },
                series: [{
                    type: 'column',
                    name: name,
                    data: data,
                    color: 'white'
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
            rookieUtils.drawColumnRange(rookieUtils.generateData(rookie.timings, rookie.resources));
            //rookieUtils.drawCharts();
        }
    }, 0);

};