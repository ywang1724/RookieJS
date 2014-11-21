function foo() {
    for(var i = 0; i < 10000000; i++);
}
function bar() {
    for(var i = 0; i < 100000000; i++);
}

function getPrefix() {
    var prefix = null;
    if (window.performance !== undefined) {
        if (window.performance.now !== undefined)
            prefix = "";
        else {
            var browserPrefixes = ["webkit","moz","ms","o"];
            // Test all vendor prefixes
            for(var i = 0; i < browserPrefixes.length; i++) {
                if (window.performance[browserPrefixes[i] + "Now"] != undefined) {
                    prefix = browserPrefixes[i];
                    break;
                }
            }
        }
    }
    return prefix;
}

function getTime() {
    return (prefix === "") ? window.performance.now() : window.performance[prefix + "Now"]();
}

function doBenchmark() {
    if (prefix === null)
        document.getElementById("log").innerHTML = "Your browser does not support High Resolution Time API";
    else {
        var startTime = getTime();
        foo();
        var test1 = getTime();
        bar();
        var test2 = getTime();
        document.getElementById("log").innerHTML += "Test1 time: " + (test1 - startTime) + "<br />";
        document.getElementById("log").innerHTML += "Test2 time: " + (test2 - test1) + "<br />";
    }
}
var prefix = getPrefix();
window.onload = doBenchmark;