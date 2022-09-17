(function () {
    var rate = 1;
    var show = false;
    var keydown = false;
    var timeout = -1;
    if (localStorage.getItem("rv-rate") != null) {
        rate = parseFloat(localStorage.getItem("rv-rate"));
    }
    var div = document.createElement("div");
    div.classList.add("rv-div");
    div.innerHTML = "x <span id='rv-rate'>0.5</span>";
    document.body.appendChild(div);
    div.classList.add("rv-hide");
    div.style.display = "none";
    var rate_span = document.getElementById("rv-rate");
    setRate();
    var videos = getVideos();
    videos.forEach((v) => {
        v.onplay = function () {
            this.playbackRate = rate;
        }
    });

    var observer = new MutationObserver(() => {
        setRate();
        // if (document.fullscreenElement != null) {
        //     if (fullElement != document.fullscreenElement) {
        //         document.body.removeChild(div);
        //         if (fullElement != null && fullElement != 0) {
        //             fullElement.removeChild(div);
        //         }
        //         fullElement = document.fullscreenElement;
        //         fullElement.appendChild(div);
        //     }
        // } else {
        //     if (div.parentElement != document.body) {
        //         fullElement.removeChild(div);
        //         document.body.appendChild(div);
        //     }
        // }
    });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    document.body.onkeydown = (e) => {
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
            return;
        }
        if (e.keyCode == 192) {
            var w = window.innerWidth - document.body.offsetWidth;
            keydown = true;
            e.preventDefault();
            document.body.style.overflowY = "hidden";
            document.body.style.marginRight = w + "px";
        }
    }

    /**
     * 
     * @param {KeyboardEvent} e 
     * @returns 
     */
    document.body.addEventListener("keypress", (e) => {
        // focus in the input box
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
            return;
        }
        if (keydown) {
            if (e.key.toLowerCase() == "p") {
                screenshot();
            } else if (e.key.toLowerCase() == "r") {
                var videos = getVideos();
                videos.forEach((v) => {
                    if (v.style.transform == "scaleX(-1)") {
                        v.style.transform = "scaleX(1)";
                    } else {
                        v.style.transform = "scaleX(-1)";
                    }
                });
            } else if (e.key.toLowerCase() == "i") {
                pip();
                e.stopPropagation();
                e.preventDefault();
            }
        }
    });

    function pip() {
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
            return
        }
        var videos = getVideos();
        let max_width = 0;
        let max_video;
        videos.forEach((v) => {
            if (v.videoWidth > max_width) {
                max_video = v;
                max_width = v.videoWidth;
            }
        });
        if (max_video) {
            max_video.requestPictureInPicture();
        }
    }

    document.body.onkeyup = (e) => {
        // focus in the input box
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
            return;
        }
        if (e.keyCode == 192) {
            keydown = false;
            document.body.style.overflowY = "auto";
            document.body.style.marginRight = "0px";
            e.preventDefault();
        }
    }

    document.body.addEventListener("mousewheel", function (e) {
        if (keydown) {
            var d = e.deltaY / 2000 / 0.05;
            d = parseInt(d);
            d = d * 0.05;
            rate -= d;
            if (rate <= 0.2) {
                rate = 0.2;
            }
            if (rate >= 16) {
                rate = 16;
            }
            setRate();
            show = true;
            rate = parseFloat(rate).toFixed(2);
            rate_span.innerText = rate;
            div.classList.remove("rv-hide");
            div.style.display = "block";
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (show) {
                    div.classList.add("rv-hide");
                    timeout = setTimeout(() => {
                        if (show) {
                            show = false;
                            div.style.display = "none";
                        }
                    }, 500);
                }
            }, 1000);
            return true;
        }
    });

    document.body.onscroll = function (e) {
        if (keydown) {
            e.preventDefault();
        }
    }

    function setRate() {
        var videos = getVideos();
        localStorage.setItem("rv-rate", rate);
        videos.forEach((v) => {
            if (v.playbackRate != rate) {
                v.playbackRate = rate;
            }
        });
        // chrome.runtime.sendMessage({
        //     action: "change_rate",
        //     data: rate
        // }, function (response) {
        // });
    }

    function getVideos() {
        return [...document.getElementsByTagName("video")];
    }

    async function screenshot() {
        var videos = getVideos();
        if (videos.length == 0) {
            return;
        }
        var max = 0;
        var maxVideo = undefined;
        for (var video of videos) {
            if (video.offsetWidth > max) {
                maxVideo = video;
                max = video.offsetWidth;
            }
        }
        var video = maxVideo;
        var width = video.videoWidth;
        var height = video.videoHeight;
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        document.body.append(canvas);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
        var blob = await canvasToBlob(canvas);
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = Date.now() + ".png";
        document.body.append(a);
        a.click();
        document.body.removeChild(a);
        document.body.removeChild(canvas);
    }

    function canvasToBlob(canvas) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, "png", 1);
        });
    }

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.action == "get_rate") {
            sendResponse(rate);
            return;
        } else if (message.action == "set_rate") {
            rate = message.data;
            setRate();
            sendResponse(rate);
            return;
        } else if (message.action == "videoshot") {
            screenshot();
            sendResponse(rate);
        } else if (message.action == "pip") {
            pip();
            sendResponse(rate);
        }
    });
})();