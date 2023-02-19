// ==UserScript==
// @name         bili subtitle download
// @version      0.5.11
// @description  download json subtitle from biliintl
// @author       AdvMaple
// @match        /\:\/\/.*.bili.*\/play\/.*$/
// @include      /\:\/\/.*.bili.*\/play\/.*$/
// @icon         https://www.google.com/s2/favicons?domain=biliintl.com
// @grant        GM_addStyle
// @require      http://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js

// ==/UserScript==

(function() {
    'use strict';

    var sub_language='vi';
    var sub_format = 'srt';
    /**
   * Convert second to time stamp
   * @param {*} sec
   */
    function secToTimer(sec) {
        let o = new Date(0);
        let p = new Date(sec * 1000);
        return new Date(p.getTime() - o.getTime())
            .toISOString()
            .split("T")[1]
            .split("Z")[0];
    }

    function getEpTitle(title) {
        console.log(title);
        if (title === null) {
            return "1";
        }
        return title;
    }

    var zip = new JSZip();
    var downloadedEpCount = 0;
    /**
   * Generate subtitle
   * @param {*} ep_id
   * @param {string} title
   * @param {string} epTitle
   * @param {boolean} thisEp
   */
    function generateSubtitle(ep_id, title, epTitle, thisEp,volumeCount) {
        const FETCH_URL = `https://api.bilibili.tv/intl/gateway/web/v2/subtitle?s_locale=vi_VN&platform=web&episode_id=${ep_id}&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=bstar-web.homepage.top-list.all`;
        fetch(FETCH_URL, {credentials: "include"})
            .then((r) => r.json())
            .then(({ data }) => {
            if (data.subtitles === null) alert("There has been some problems, please contract dev");
            //Take data in response
            //Get number in subtitle files in data
            for (let i = 0; i < data.subtitles.length; i++) {
                if (data.subtitles[i]["lang_key"] == sub_language) {
                    var ep_sub_url = data.subtitles[i].url;
                    fetch(ep_sub_url)
                        .then((r) => r.json())
                        .then((d) => {


                        //Create blob object of json subtitle
                        let blob;
                        let text = "";
                        // Generate SRT and Web VTT format
                        if (sub_format === 'vtt' || sub_format === 'srt') {
                            if (sub_format === 'vtt') {
                                text += `WEBVTT\nKind: captions\nLanguage: ${sub_language}\n\n`
                  }
                            // Map body
                            d.body.forEach((item, index) => {
                                // Get start time
                                const from = secToTimer(item.from !== undefined ? item.from : 0);
                                // Get end time
                                const to = secToTimer(item.to);
                                // Line
                                text += index + 1 + "\n";
                                // Time
                                text += `${from.replace(".", ",")} --> ${to.replace(".", ",")}\n`;
                                // Content
                                text += item.content + "\n\n";
                            });
                            blob = new Blob([text], {
                                type: "text/plain",
                            });
                        } else { // Generate JSON format
                            blob = new Blob([JSON.stringify(d)], {
                                type: "application/json",
                            });
                        }

                        zip.file(title+".srt", blob);
                        downloadedEpCount++;
                        if(downloadedEpCount === volumeCount) {
                            zip.generateAsync({type:"blob"})
                                .then(function (_b) {
                                //Create <a> tag
                                var a = document.createElement("a");
                                a.download = document.title;
                                a.textContent = document.title;
                                a.href = URL.createObjectURL(_b);
                                document.body.appendChild(a);
                                a.click();
                            });
                        }
                    });
                    break;
                }
            }
        });
    }
    var listEpDoms = document.getElementsByClassName('ep-item__reference');
    for (let i = 0; i < listEpDoms.length; i++) {
        const epDom = listEpDoms[i]
        const pathnameArr = epDom.pathname.split('/');
        let thisEpId, seriesId;
        if (pathnameArr.length === 5) {
            thisEpId = pathnameArr[pathnameArr.length - 1];
            seriesId = pathnameArr[pathnameArr.length - 2];
        } else {
            seriesId = pathnameArr[pathnameArr.length - 1];
        }
        var title = epDom.innerHTML;
        generateSubtitle(thisEpId, title, null, true,listEpDoms.length);


    }
})();
