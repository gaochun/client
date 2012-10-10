Updater = {
  firstDetectTime : 10 * 1000, /*10s after start runtime*/
  timeInterval : 60 * 60 * 1000, /*1 hour.*/
  timeoutValue : 5 * 1000,
  checkUrl: "http://rt24-labs.sh.intel.com/check_update",
  showNotification : true,
  
  checkUpdate : function (manual) {
    // Set timer for next detection.
    if (!manual)
      setTimeout(Updater.checkUpdate, Updater.timeInterval);
    
    chrome.management.getAll(function (results) {
      var param = "";
      var paramForGoogle = "";
      for (var i in results) {
        if (results[i].isApp && results[i].id != 'licffdjdbhojjgheefcjeddlepijjoee') {
          param += 'x=id%3D' + results[i].id + '%26v%3D' + results[i].version + '%26uc' + '&';
        }
      };
      
      var apps = [];      
      function requsetUpdateManifest(url, params) {
        var xhr = new XMLHttpRequest();
        params = params.substr(0, params.length - 1);
        xhr.open("GET", url + '?' + params, true);
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4) {
            if (xhr.status == 200) {
              console.log("Response from " + url + " received");
              var doc = xhr.responseXML;
              if (doc != null) {
                var child = doc.documentElement.firstChild;
                while (child != null) {
                  if (child.nodeName == 'app') {
                    var updateCheckNode = child.getElementsByTagName("updatecheck").item(0);
                    var status = updateCheckNode.getAttribute('status');
                    if (status == "ok") {
                      var version = updateCheckNode.getAttribute('version');
                      if (version == '')
                        version = '0.0.0.0';
                      var app = {
                        'id' : child.getAttribute('appid'),
                        'version' : updateCheckNode.getAttribute('version'),
                        'url' : updateCheckNode.getAttribute('codebase')
                      }
                      apps.push(app);
                    }
                  }
                  child = child.nextSibling;
                }
              }
            }
            
            chrome.extension.sendMessage({
              updates : apps,
              name : 'update_notifiy'
            });
          }
        }
        xhr.onerror = function () {
          console.log("Check update failed.");
        }
        xhr.send();
        
        setTimeout(function () {
          xhr.abort();
        }, Updater.timeoutValue);
      }
      
      if (param != "") {
        // Start requesting update info.
        requsetUpdateManifest(Updater.checkUrl, param);
        console.log("Check update in lab server.")
      } else {
        // Update opend notificaton dialog
        chrome.extension.sendMessage({
          updates : [],
          name : 'update_notifiy'
        });
      }
    });
  }
};

// Recheck updates when app is installed or uninstalled.
chrome.management.onInstalled.addListener(function (info) {
  Updater.checkUpdate(true);
});
chrome.management.onUninstalled.addListener(function (info) {
  Updater.checkUpdate(true);
});
chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.name == "check_update") {
    Updater.checkUpdate(true);
  }
});

setTimeout(Updater.checkUpdate, Updater.firstDetectTime);
