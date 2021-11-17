let rateElement = document.querySelector("#rate");
var rate = 1;
let buttons = document.querySelectorAll("input[type=button]");
// let rate = 0;
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
        action: "get_rate"
    }, function (res) {
        res = parseFloat(res).toFixed(2);
        rate = parseFloat(res);
        rateElement.innerText = res;
    })
});
function changeRate(e) {
    let btn = e.target;
    let value = btn.value;
    if (value == "Video Shot") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "videoshot",
                data: rate
            }, function () {
            })
        });
        return;
    }
    if (value == "PIP") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "pip",
                data: rate
            }, function () {
            })
        });
        return;
    }
    if (value.startsWith("+") || value.startsWith("-")) {
        rate += parseFloat(value);
    } else {
        rate = parseFloat(value);
    }
    if (rate <= 0.2) {
        rate = 0.2;
    } else if (rate >= 16) {
        rate = 16;
    }
    console.log(rate);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "set_rate",
            data: rate
        }, function (res) {
            res = parseFloat(res).toFixed(2);
            rate = parseFloat(res);
            rateElement.innerText = res;
        })
    });
}
for (let button of buttons) {
    button.addEventListener("click", changeRate);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action == "change_rate") {
        rate = message.data;
    }
    sendResponse();
});